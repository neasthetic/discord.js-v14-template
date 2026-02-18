const PrefixCommand = require('../../../system/structures/PrefixCommand');

module.exports = new PrefixCommand({
  name: 'hello',
  aliases: ['oi', 'ola'],
  description: 'Comando prefixado simples de exemplo.',
  run: async (client, message) => {
    const appemoji = client.appemoji || global.appemoji;
    await message.reply(`${appemoji.success || '✅'} Olá, ${message.author}! Esse é um comando por prefixo.`);
  },
}).toJSON();
