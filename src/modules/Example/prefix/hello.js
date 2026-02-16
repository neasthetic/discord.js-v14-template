const PrefixCommand = require('../../../system/structures/PrefixCommand');

module.exports = new PrefixCommand({
  name: 'hello',
  aliases: ['oi', 'ola'],
  description: 'Comando prefixado simples de exemplo.',
  run: async (client, message) => {
    const emojis = client.emojis || global.emojis;
    await message.reply(`${emojis.success || '✅'} Olá, ${message.author}! Esse é um comando por prefixo.`);
  },
}).toJSON();
