const emojisJson = require('../resources/emojis.json');
const Logger = require('./Logger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EMOJI_ID_REGEX = /\/emojis\/(\d+)\./i;
const DISCORD_EMOJI_REGEX = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/;
const HTTP_URL_REGEX = /^https?:\/\//i;
const DEFAULT_CACHE_FILE_PATH = path.resolve(__dirname, '../resources/.appemoji-sync-cache.json');

const emojiStore = { ...emojisJson };

const normalizeName = (name) => String(name || '').trim().toLowerCase();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const computeSourceSignature = () => {
  const normalizedEntries = Object.entries(emojisJson)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => [key, String(value)]);

  return crypto
    .createHash('sha1')
    .update(JSON.stringify(normalizedEntries))
    .digest('hex');
};

const readSyncCache = (cacheFilePath) => {
  try {
    if (!fs.existsSync(cacheFilePath)) return null;
    const raw = fs.readFileSync(cacheFilePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeSyncCache = (cacheFilePath, payload) => {
  try {
    fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
    fs.writeFileSync(cacheFilePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // ignorado silenciosamente para não bloquear o boot
  }
};

const setEmojiValue = (name, value) => {
  if (!name || typeof name !== 'string') return;
  emojiStore[name] = value;
};

const findKey = (name) => {
  if (!name) return null;

  const direct = Object.prototype.hasOwnProperty.call(emojiStore, name) ? name : null;
  if (direct) return direct;

  const normalized = normalizeName(name);
  if (!normalized) return null;

  return Object.keys(emojiStore).find((key) => key.toLowerCase() === normalized) || null;
};

const extractIdFromValue = (value) => {
  if (typeof value !== 'string') return null;

  const mentionMatch = value.match(DISCORD_EMOJI_REGEX);
  if (mentionMatch) return mentionMatch[2];

  const cdnMatch = value.match(EMOJI_ID_REGEX);
  if (cdnMatch) return cdnMatch[1];

  return null;
};

const toDisplay = (name) => {
  const key = findKey(name);
  if (!key) return '';

  const value = emojiStore[key];
  const id = extractIdFromValue(value);

  if (id) return `<:${key}:${id}>`;
  return typeof value === 'string' ? value : '';
};

const toButtonEmoji = (name) => {
  const key = findKey(name);
  if (!key) return undefined;

  const value = emojiStore[key];
  const id = extractIdFromValue(value);

  if (id) {
    return { id, name: key };
  }

  if (typeof value === 'string' && !value.startsWith('http')) {
    return { name: value };
  }

  return undefined;
};

const toUrl = (name) => {
  const key = findKey(name);
  return key ? emojiStore[key] : undefined;
};

const sync = async (client, options = {}) => {
  const delayMs = Number.isFinite(options.delayMs) ? Number(options.delayMs) : 1500;
  const cooldownMs = Number.isFinite(options.cooldownMs) ? Number(options.cooldownMs) : 0;
  const skipIfUnchanged = options.skipIfUnchanged !== false;
  const cacheFilePath = typeof options.cacheFilePath === 'string' && options.cacheFilePath.trim()
    ? options.cacheFilePath
    : DEFAULT_CACHE_FILE_PATH;
  const logger = options.logger || Logger;

  if (!client?.application?.emojis) {
    logger?.warn?.('Sincronização de app emojis ignorada: client.application.emojis indisponível.');
    return {
      total: Object.keys(emojisJson).length,
      existing: 0,
      created: 0,
      skipped: Object.keys(emojisJson).length,
      failed: 0,
    };
  }

  const result = {
    total: 0,
    existing: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    fromCache: false,
  };

  try {
    const sourceEntries = Object.entries(emojisJson);
    result.total = sourceEntries.length;

    const sourceSignature = computeSourceSignature();
    const appId = String(client.application?.id || client.user?.id || 'unknown');

    if (skipIfUnchanged) {
      const cache = readSyncCache(cacheFilePath);
      const hasValidCache =
        cache &&
        cache.status === 'ok' &&
        cache.appId === appId &&
        cache.sourceSignature === sourceSignature &&
        cache.resolved &&
        typeof cache.resolved === 'object';

      const withinCooldown =
        cooldownMs <= 0 || (Number(cache?.syncedAt) > 0 && Date.now() - Number(cache.syncedAt) < cooldownMs);

      if (hasValidCache && withinCooldown) {
        for (const [name, value] of Object.entries(cache.resolved)) {
          setEmojiValue(name, value);
        }

        result.existing = Object.keys(cache.resolved).length;
        result.fromCache = true;
        return result;
      }
    }

    const appEmojis = await client.application.emojis.fetch();
    const appEmojiByName = new Map();

    for (const emoji of appEmojis.values()) {
      appEmojiByName.set(normalizeName(emoji.name), emoji);
    }

    for (const [name, source] of sourceEntries) {
      const existing = appEmojiByName.get(normalizeName(name));

      if (existing) {
        setEmojiValue(name, `<:${existing.name}:${existing.id}>`);
        result.existing += 1;
        continue;
      }

      if (typeof source !== 'string' || !HTTP_URL_REGEX.test(source)) {
        setEmojiValue(name, source);
        result.skipped += 1;
        continue;
      }

      try {
        const created = await client.application.emojis.create({
          attachment: source,
          name,
        });

        setEmojiValue(name, `<:${created.name}:${created.id}>`);
        appEmojiByName.set(normalizeName(created.name), created);
        result.created += 1;

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      } catch (error) {
        result.failed += 1;
        setEmojiValue(name, source);
        logger?.warn?.(`Falha ao criar app emoji "${name}": ${error?.message || error}`);
      }
    }

    if (result.failed === 0) {
      const resolved = {};
      for (const [name] of sourceEntries) {
        resolved[name] = toUrl(name);
      }

      writeSyncCache(cacheFilePath, {
        status: 'ok',
        syncedAt: Date.now(),
        appId,
        sourceSignature,
        resolved,
      });
    }

    return result;
  } catch (error) {
    logger?.error?.(`Falha ao sincronizar app emojis: ${error?.message || error}`);
    return result;
  }
};

const emojiDisplayProxy = new Proxy({}, {
  get(_, prop) {
    if (typeof prop !== 'string') return undefined;

    if (prop === 'get') return (name) => toDisplay(name);
    if (prop === 'has') return (name) => Boolean(findKey(name));
    if (prop === 'keys') return () => Object.keys(emojiStore);

    return toDisplay(prop);
  },
});

const emojiButtonProxy = new Proxy({}, {
  get(_, prop) {
    if (typeof prop !== 'string') return undefined;

    if (prop === 'get') return (name) => toButtonEmoji(name);
    if (prop === 'has') return (name) => Boolean(findKey(name));

    return toButtonEmoji(prop);
  },
});

const emojiUrlProxy = new Proxy({}, {
  get(_, prop) {
    if (typeof prop !== 'string') return undefined;

    if (prop === 'get') return (name) => toUrl(name);
    if (prop === 'has') return (name) => Boolean(findKey(name));

    return toUrl(prop);
  },
});

const emojis = new Proxy({}, {
  get(_, prop) {
    if (typeof prop !== 'string') return undefined;

    if (prop === 'button') return emojiButtonProxy;
    if (prop === 'component') return emojiButtonProxy;
    if (prop === 'url') return emojiUrlProxy;
    if (prop === 'raw') return emojiUrlProxy;
    if (prop === 'get') return (name) => toDisplay(name);
    if (prop === 'getButton') return (name) => toButtonEmoji(name);
    if (prop === 'getUrl') return (name) => toUrl(name);
    if (prop === 'has') return (name) => Boolean(findKey(name));
    if (prop === 'keys') return () => Object.keys(emojiStore);
    if (prop === 'sync') return (client, options) => sync(client, options);

    return toDisplay(prop);
  },
});

module.exports = emojis;