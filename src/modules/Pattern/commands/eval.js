const ApplicationCommand = require('../../../system/structures/ApplicationCommand');
const { ApplicationCommandType, ApplicationCommandOptionType, MessageFlags } = require('discord.js');

module.exports = new ApplicationCommand({
  command: {
    name: 'eval',
    description: 'Execute a JavaScript code.',
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: 'code',
        description: 'Código JavaScript para executar',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  run: async (_client, interaction) => {
    const code = interaction.options.getString('code');

    try {
      // Aviso: nunca use eval em produção sem validação.
      // Exemplo simples e seguro: retornar texto original.
      await interaction.reply({
        content: `Entrada recebida: ${code}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      await interaction.reply({
        content: 'Falha ao executar o comando.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
}).toJSON();
