const { ActivityType } = require("discord.js");
const settings = require("./settings.js");
const Logger = require("./utils/Logger");
const appemoji = require("./utils/Emojis");
const componentsV2 = require("./utils/ComponentsV2");
const modalV2 = require("./utils/ModalV2");
const config = require("./loaders/load-env");

const client = require("./loaders/load-client");
const ConnectDatabase = require("./loaders/load-database");
client.appemoji = appemoji;
client.componentsV2 = componentsV2;
client.modalV2 = modalV2;
global.appemoji = appemoji;
global.componentsV2 = componentsV2;
global.modalV2 = modalV2;
module.exports = client;

(async () => {
  console.clear();
  Logger.system(`Inicializando sistema... \n`);

  await ConnectDatabase();

  require("./loaders/load-modules")(client);
  require("./handler/onInteraction")(client);

  if (settings?.COMMANDS?.PREFIX_COMMANDS_ENABLED) {
    require("./handler/onPrefixCommand")(client);
  }

  require("./handler/ErrorTreatment.js")(client);

  client.once("clientReady", async () => {
    const botName = `${client.user.tag}`.yellow.bold;
    Logger.success(`Autenticado e conectado como ${botName}`);

    const { ACTIVITY_TYPE, ACTIVITY_NAME, ACTIVITY_URL, STATUS } =
      settings.BOT_IDENTITY;

    const rawType = ACTIVITY_TYPE ?? "Custom";
    const typeKey = String(rawType).trim();
    const capitalizedKey =
      typeKey.charAt(0).toUpperCase() + typeKey.slice(1).toLowerCase();
    const activityType =
      typeof rawType === "number"
        ? rawType
        : (ActivityType[typeKey] ??
          ActivityType[capitalizedKey] ??
          ActivityType.Custom);

    const activity = { name: String(ACTIVITY_NAME || ""), type: activityType };

    if (activityType === ActivityType.Custom) activity.state = activity.name;

    if (activityType === ActivityType.Streaming) {
      if (!ACTIVITY_URL)
        Logger.warn(
          "ACTIVITY_URL não definido para Streaming. O Discord pode ignorar o tipo.",
        );
      else activity.url = ACTIVITY_URL;
    }

    client.user.setPresence({
      status: String(STATUS || "online").toLowerCase(),
      activities: [activity],
    });
  });

  await client.login(config.BOT_TOKEN).catch((err) => {
    Logger.error(`Erro ao conectar o bot: ${err.message}`);
    Logger.warn(`Verifique se o BOT_TOKEN está correto no arquivo .env`);
    process.exit(1);
  });
})();
