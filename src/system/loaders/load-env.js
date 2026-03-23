const path = require("path");
const dotenv = require("dotenv");
const Logger = require("../utils/Logger");

const result = dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

if (result.error) {
  Logger.warn(
    "[ENV] .env não encontrado. Usando variáveis de ambiente do sistema.",
  );
}

module.exports = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [
    k,
    v === "true" ? true : v === "false" ? false : v,
  ]),
);
