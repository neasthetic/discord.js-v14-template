require("colors");

const TYPE_CONFIG = {
  success: {
    label: "SUCESSO",
    color: "green",
  },
  warn: {
    label: "ALERTA",
    color: "yellow",
  },
  error: {
    label: "ERROR",
    color: "red",
  },
  info: {
    label: "INFO",
    color: "blue",
  },
  system: {
    label: "SISTEMA",
    color: "magenta",
  },
};

function normalizeType(type) {
  if (!type) return "info";
  return String(type).trim().toLowerCase();
}

function formatPrefix(type) {
  const normalized = normalizeType(type);
  const config = TYPE_CONFIG[normalized] || TYPE_CONFIG.info;

  return `[${config.label}]`[config.color].bold;
}

function log(type, message) {
  const prefix = formatPrefix(type);
  const content = message == null ? "" : String(message);
  console.log(`${prefix} ${content}`);
}

// Aliases
log.success = (message) => log("success", message);
log.warn = (message) => log("warn", message);
log.error = (message) => log("error", message);
log.info = (message) => log("info", message);
log.system = (message) => log("system", message);

module.exports = log;
