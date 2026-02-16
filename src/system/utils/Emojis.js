const emojisJson = require('../resources/emojis.json');

const EMOJI_ID_REGEX = /\/emojis\/(\d+)\./i;
const DISCORD_EMOJI_REGEX = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/;

const normalizeName = (name) => String(name || '').trim().toLowerCase();

const findKey = (name) => {
  if (!name) return null;

  const direct = Object.prototype.hasOwnProperty.call(emojisJson, name) ? name : null;
  if (direct) return direct;

  const normalized = normalizeName(name);
  if (!normalized) return null;

  return Object.keys(emojisJson).find((key) => key.toLowerCase() === normalized) || null;
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

  const value = emojisJson[key];
  const id = extractIdFromValue(value);

  if (id) return `<:${key}:${id}>`;
  return typeof value === 'string' ? value : '';
};

const toButtonEmoji = (name) => {
  const key = findKey(name);
  if (!key) return undefined;

  const value = emojisJson[key];
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
  return key ? emojisJson[key] : undefined;
};

const emojiDisplayProxy = new Proxy({}, {
  get(_, prop) {
    if (typeof prop !== 'string') return undefined;

    if (prop === 'get') return (name) => toDisplay(name);
    if (prop === 'has') return (name) => Boolean(findKey(name));
    if (prop === 'keys') return () => Object.keys(emojisJson);

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
    if (prop === 'keys') return () => Object.keys(emojisJson);

    return toDisplay(prop);
  },
});

module.exports = emojis;