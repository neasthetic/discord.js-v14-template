const Logger = require('../utils/Logger');
const settings = require('../settings');
const config = require('../loaders/load-env');
const client = require('../loaders/load-client');
const appemoji = require('../utils/Emojis');

const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

const emojiSyncSettings = settings.APP_EMOJI_SYNC || {};

const run = async () => {
  if (!config.BOT_TOKEN) {
    Logger.error('BOT_TOKEN não encontrado. Configure o arquivo .env antes de executar.');
    process.exit(1);
  }

  Logger.system(`Iniciando instalação de app emojis${force ? ' (modo force)' : ''}...`);

  let exitCode = 0;

  try {
    await client.login(config.BOT_TOKEN);

    if (!client.isReady()) {
      await new Promise((resolve) => client.once('clientReady', resolve));
    }

    const syncResult = await appemoji.sync(client, {
      logger: Logger,
      delayMs: Number(emojiSyncSettings.CREATE_DELAY_MS ?? 1200),
      skipIfUnchanged: force ? false : emojiSyncSettings.SKIP_IF_UNCHANGED !== false,
      cooldownMs: force ? 0 : Number(emojiSyncSettings.CHECK_COOLDOWN_MINUTES ?? 60) * 60 * 1000,
    });

    if (syncResult.fromCache) {
      Logger.info('App emojis carregados do cache local (sem nova verificação na API).');
    }

    Logger.success(
      `Sincronização concluída: existentes=${syncResult.existing}, criados=${syncResult.created}, falhas=${syncResult.failed}, ignorados=${syncResult.skipped}`
    );

    if (syncResult.failed > 0) {
      exitCode = 1;
    }
  } catch (error) {
    exitCode = 1;
    Logger.error(`Falha ao instalar/sincronizar app emojis: ${error?.message || error}`);
  } finally {
    try {
      await client.destroy();
    } catch {
      // noop
    }
    process.exit(exitCode);
  }
};

run();
