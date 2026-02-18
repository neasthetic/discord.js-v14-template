const { ActivityType } = require('discord.js');
const settings = require('./settings.js');
const Logger = require('./utils/Logger');
const appemoji = require('./utils/Emojis');
const config = require('./loaders/load-env'); 

const client = require('./loaders/load-client'); 
client.appemoji = appemoji;
global.appemoji = appemoji;
module.exports = client;

(async () => {
    console.clear();
    Logger.system(`Inicializando sistema... \n`);

    const ConnectDatabase = require('./loaders/load-database'); 
    await ConnectDatabase();

    require('./loaders/load-modules')(client);
    require('./handler/onInteraction')(client);
        if (settings?.COMMANDS?.PREFIX_COMMANDS_ENABLED) {
            require('./handler/onPrefixCommand')(client);
        }
    require('./handler/ErrorTreatment.js')(client);

        client.once('clientReady', async () => {
      const botName = `${client.user.tag}`.yellow.bold;
      Logger.success(`Autenticado e conectado como ${botName}`)

            const emojiSyncSettings = settings.APP_EMOJI_SYNC || {};
            const shouldSync = emojiSyncSettings.ENABLED !== false;

            if (shouldSync) {
                const syncResult = await appemoji.sync(client, {
                    logger: Logger,
                    delayMs: Number(emojiSyncSettings.CREATE_DELAY_MS ?? 1200),
                    skipIfUnchanged: emojiSyncSettings.SKIP_IF_UNCHANGED !== false,
                    cooldownMs: Number(emojiSyncSettings.CHECK_COOLDOWN_MINUTES ?? 60) * 60 * 1000,
                });

                if (syncResult.fromCache) {
                    Logger.info('App emojis carregados do cache local (sem nova verificação na API).');
                } else {
                    Logger.info(`App emojis sincronizados: existentes=${syncResult.existing}, criados=${syncResult.created}, falhas=${syncResult.failed}, ignorados=${syncResult.skipped}`);
                }
            } else {
                Logger.info('Sincronização de app emojis desativada em settings.APP_EMOJI_SYNC.ENABLED.');
            }
      
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
        Logger.error(`Erro ao conectar o bot: ${err.message}`);
        Logger.warn(`Verifique se o BOT_TOKEN está correto no arquivo .env`);
        process.exit(1);
    });

})();
