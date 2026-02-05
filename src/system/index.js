require('colors');
const { ActivityType } = require('discord.js');
const settings = require('./settings.js');
const Logger = require('./utils/Logger');
const config = require('./loaders/load-env'); 

const client = require('./loaders/load-client'); 
module.exports = client;

(async () => {
    console.clear();
    Logger.system(`Inicializando sistema... \n`);

    const ConnectDatabase = require('./loaders/load-database'); 
    await ConnectDatabase();

    require('./utils/ExportsRegistry').initExportsGlobal();

    client.removeAllListeners('interactionCreate');
    require('./loaders/load-modules')(client);
    require('./handler/onInteraction')(client);
    require('./handler/ErrorTreatment.js')(client);

    client.once('clientReady', () => {
      const botName = `${client.user.tag}`.yellow.bold;
      Logger.success(`Autenticado e conectado como ${botName}`)
      
      const { ACTIVITY_TYPE, ACTIVITY_NAME, ACTIVITY_URL, STATUS } = settings.BOT_IDENTITY;

      const typeMap = {
          playing: ActivityType.Playing,
          streaming: ActivityType.Streaming,
          listening: ActivityType.Listening,
          watching: ActivityType.Watching,
          competing: ActivityType.Competing,
          custom: ActivityType.Custom,
      };

      const rawType = ACTIVITY_TYPE ?? 'Custom';
      const normalizedType = String(rawType).trim();
      const activityType = typeof rawType === 'number'
          ? rawType
          : (ActivityType[normalizedType] ?? typeMap[normalizedType.toLowerCase()] ?? ActivityType.Custom);

      const activity = {
          name: String(ACTIVITY_NAME || ''),
          type: activityType,
      };

      if (activityType === ActivityType.Streaming) {
          if (!ACTIVITY_URL) {
              Logger.warn('ACTIVITY_URL não definido para Streaming. O Discord pode ignorar o tipo.');
          } else {
              activity.url = ACTIVITY_URL;
          }
      }

      client.user.setPresence({
          status: String(STATUS || 'online').toLowerCase(),
          activities: [activity],
      });
    });

    await client.login(config.BOT_TOKEN).catch(err => {
        Logger.failed(`Erro ao conectar o bot: ${err.message}`);
        Logger.warn(`Verifique se o BOT_TOKEN está correto no arquivo .env`);
        process.exit(1);
    });

})();
