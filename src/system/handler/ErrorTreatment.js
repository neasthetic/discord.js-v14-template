const fetch = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null;
const settings = require("../settings.js");
const { ANTI_CRASH } = settings;
const Logger = require("../utils/Logger.js");

require("colors");

const DEFAULT_ERROR_WEBHOOK = ANTI_CRASH.ERROR_WEBHOOK;

const DEDUP_WINDOW_MS = 60_000;
const CACHE_CLEANUP_INTERVAL_MS = 600_000;

module.exports = (client, options = {}) => {
  const {
    errorWebhook = DEFAULT_ERROR_WEBHOOK,
    ignoreKinds = [],
    rateLimitMs = ANTI_CRASH.RATE_LIMIT_MS || 5000,
  } = options;

  const logDebug = (...args) => {
    // Debug opcional para diagnostico do anti-crash.

  };

  const dedupCache = new Map();
  const occurrenceStats = new Map();
  const webhookLastSend = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [fp, ts] of dedupCache.entries()) {
      if (now - ts > DEDUP_WINDOW_MS * 2) {
        logDebug("Limpando fingerprint do cache:", fp);
        dedupCache.delete(fp);
      }
    }
  }, CACHE_CLEANUP_INTERVAL_MS).unref?.();

  // Utilitarios internos.
  const nowISO = () => new Date().toISOString();
  const truncate = (txt, max = 3900) => (txt && txt.length > max ? txt.slice(0, max) + "\n…(truncado)" : txt || "");
  const plural = (v, s, p) => `${v} ${v === 1 ? s : p}`;

  const topFrameFrom = (stack) => {
    const match = /\n\s*at\s+([^\n]+)\n?/.exec(stack || "");
    return match ? match[1].trim() : "";
  };

  const normalizeError = (input) => {
    const err = input instanceof Error ? input : new Error(String(input));
    const name = err.name || "Error";
    const message = err.message || "";
    const stack = err.stack ? String(err.stack) : "";
    const topFrame = topFrameFrom(stack);

    return { name, message, stack, topFrame };
  };

  const fingerprintOf = (kind, info) =>
    `${kind}|${info.name}|${(info.message || "").slice(0, 200)}|${info.topFrame || ""}`;

  const formatUptime = () => {
    const totalSeconds = Math.floor(process.uptime());
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days) parts.push(plural(days, "dia", "dias"));
    if (hours || days) parts.push(plural(hours, "hora", "horas"));
    if (minutes || hours || days) parts.push(plural(minutes, "minuto", "minutos"));
    parts.push(plural(seconds, "segundo", "segundos"));

    return parts.join(", ");
  };

  const getContext = (origin = "Generic") => {
    const mu = process.memoryUsage();
    return {
      when: nowISO(),
      origin,
      botTag: client?.user?.tag ?? "N/A",
      pid: process.pid,
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      uptime: formatUptime(),
      memory: `${(mu.rss / 1048576).toFixed(1)}MB RSS / ${(mu.heapUsed / 1048576).toFixed(1)}MB Heap`,
      guilds: client?.guilds?.cache?.size ?? 0,
      shard: client?.shard?.ids?.[0] ?? null,
    };
  };

  const sendWebhook = async (url, body, label = "generic") => {
    if (!url || typeof url !== "string" || !url.startsWith("https://")) return;
    if (!fetch) {
      Logger.error('(ANTI-CRASH) fetch não disponível. Use Node 18+ para envio de webhooks.');
      return;
    }
    const now = Date.now();
    const last = webhookLastSend.get(url) || 0;
    if (now - last < rateLimitMs) return;
    webhookLastSend.set(url, now);

    const payload = {
      username: client?.user?.username || "AntiCrash",
      avatar_url: client?.user?.displayAvatarURL?.() || undefined,
      ...body,
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (![200, 204].includes(res.status)) {
        Logger.warn(`(ANTI-CRASH) Webhook "${label}" respondeu ${res.status}`);
      } else {
        logDebug(`(ANTI-CRASH) Webhook "${label}" enviado.`);
      }
    } catch (e) {
      Logger.error(`(ANTI-CRASH) Falha ao enviar webhook "${label}":`, e?.message || e);
    }
  };

  // Monta o payload do embed para o webhook.
  const BuildErrorEmbeds = (kind, info, ctx, stats) => {
    const fields = [
      { name: "Tipo", value: `\`\`\`${kind} (${info.name})\`\`\``, inline: false },
      { name: "Onde", value: info.topFrame ? `\`\`\`${info.topFrame}\`\`\`` : "(sem stack)", inline: false },
      { name: "Mensagem", value: `\`\`\`text\n${truncate(info.message || "(sem mensagem)", 500)}\n\`\`\``, inline: false },
      { name: "Recorrência", value: `\`\`\`${stats.count}x desde ${new Date(stats.first).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\`\`\``, inline: false },
      { name: "Uptime", value: ctx.uptime, inline: true },
      ...(ctx.origin ? [{ name: "Origem", value: ctx.origin, inline: true }] : []),
      ...(ctx.shard !== null ? [{ name: "Shard", value: String(ctx.shard), inline: true }] : []),
    ];

    return [
      {
        title: ":x: ERRO GRAVE DETECTADO",
        description: "O módulo de anti-crash evitou que o bot fosse desligado.",
        color: 0xff4757,
        fields,
        timestamp: ctx.when,
      },
    ];
  };

  // Registra o erro no logger local.
  const logCrash = (kind, info, origin) => {
    const location = info.topFrame ? ` @ ${info.topFrame}` : "";
    const badge = origin ? `${kind} (${origin})` : kind;
    Logger.error('\n(ANTI-CRASH)'.red + ` Detectado: ${badge}`);
  };

  // Atualiza contadores por fingerprint.
  const registerOccurrence = (fp) => {
    const now = Date.now();
    const current = occurrenceStats.get(fp) || { count: 0, first: now, last: 0 };
    const updated = { count: current.count + 1, first: current.first, last: now };
    occurrenceStats.set(fp, updated);
    return updated;
  };

  const shouldSkipSend = (fp, stats) => {
    const now = Date.now();
    const last = dedupCache.get(fp) || 0;
    const milestones = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100];
    const isMilestone = milestones.includes(stats.count);

    if (isMilestone) {
      dedupCache.set(fp, now);
      return false;
    }

    if (now - last < DEDUP_WINDOW_MS) {
      logDebug(`(ANTI-CRASH) dedup suprimido (fp=${fp}) count=${stats.count}`);
      return true;
    }

    dedupCache.set(fp, now);
    return false;
  };

  const handleError = async (kind, err, origin = "Generic") => {
    if (ignoreKinds.includes(kind)) return;

    const info = normalizeError(err);
    const fp = fingerprintOf(kind, info);
    const stats = registerOccurrence(fp);
    if (shouldSkipSend(fp, stats)) return;

    logCrash(kind, info, origin);

    const ctx = getContext(origin);
    const embed = BuildErrorEmbeds(kind, info, ctx, stats);
    await sendWebhook(errorWebhook, { embeds: embed }, "error");
  };

  // Substitui console.error para padronizar no Logger e evitar webhook.
  console.error = (...args) => {
    const formatted = args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.stack || `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === "string") return arg;
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      })
      .join(" ");

    Logger.error(formatted);
  };

  // Listeners globais de erro (Node + Discord client).
  process.on("unhandledRejection", (reason) => handleError("Unhandled Rejection", reason));
  process.on("uncaughtException", (err) => handleError("Uncaught Exception", err));

  if (client && client.on) {
    client.on("error", (err) => handleError("Client Error", err, "Client"));
    client.on("shardError", (err) => handleError("Shard Error", err, "Shard"));
  }

  Logger.success("(ANTI-CRASH) Monitoramento inicializado.");
};
