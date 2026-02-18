const ApplicationCommand = require('../../../system/structures/ApplicationCommand');
const { ApplicationCommandType } = require('discord.js');

module.exports = new ApplicationCommand({
  command: {
    name: 'hello',
    description: 'Comando slash simples de exemplo.',
    type: ApplicationCommandType.ChatInput,
  },

  run: async (client, interaction) => {
    const appemoji = client.appemoji || global.appemoji;
    await interaction.reply({
      content: `${appemoji.success || '👋'} Olá, ${interaction.user}! Esse é um comando slash de exemplo.`,
    });
  },
}).toJSON();
