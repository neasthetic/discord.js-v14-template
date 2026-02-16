const settings = require('../settings');
const Logger = require('../utils/Logger');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    try {
      if (!message || message.author?.bot) return;

      const prefix = String(settings?.COMMANDS?.PREFIX || '!');
      if (!prefix || !message.content?.startsWith(prefix)) return;

      const raw = message.content.slice(prefix.length).trim();
      if (!raw.length) return;

      const parts = raw.split(/\s+/);
      const trigger = String(parts.shift() || '').toLowerCase();
      const args = parts;

      const commandName = client.prefixAliases?.get(trigger) || trigger;
      const command = client.prefixCommands?.get(commandName);
      if (!command || typeof command.run !== 'function') return;

      await command.run(client, message, args);
    } catch (err) {
      Logger.error(`(PREFIX) Erro ao executar comando: ${err.message}`);
      if (message && !message.deleted) {
        await message.reply('❌ Ocorreu um erro ao executar esse comando.').catch(() => {});
      }
    }
  });
};
