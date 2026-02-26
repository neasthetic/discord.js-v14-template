const ApplicationCommand = require('../../../system/structures/ApplicationCommand');
const {
  ApplicationCommandType,
  MessageFlags,
} = require('discord.js');

module.exports = new ApplicationCommand({
  command: {
    name: 'modal-v2-demo',
    description: 'Exemplo de modal atualizado com upload e selects avançados.',
    type: ApplicationCommandType.ChatInput,
  },

  run: async (client, interaction) => {
    const modalV2 = client.modalV2 || global.modalV2;
    if (!modalV2?.builder) {
      await interaction.reply({
        content: '❌ Util modalV2 indisponível. Reinicie o bot para carregar os novos utils.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const customId = `modal_v2_demo_${interaction.user.id}_${Date.now()}`;
    try {
      const modal = modalV2
        .builder()
        .setCustomId(customId)
        .setTitle('Modal V2 • Demo')
        .addFields([
          {
            type: 'text',
            label: 'Descrição do teste',
            description: 'Campo de texto padrão no modal',
            customId: 'descricao',
            style: 'paragraph',
            required: true,
            placeholder: 'Digite algum texto...',
            minLength: 5,
            maxLength: 500,
          },
          {
            type: 'file',
            label: 'Upload de arquivos',
            description: 'Agora modal pode receber upload',
            customId: 'arquivos',
            required: false,
            minValues: 0,
            maxValues: 2,
          },
          {
            type: 'user-select',
            label: 'Selecionar usuários',
            customId: 'usuarios',
            placeholder: 'Selecione 1 ou 2 usuários',
            minValues: 1,
            maxValues: 2,
          },
          {
            type: 'channel-select',
            label: 'Selecionar canais',
            customId: 'canais',
            placeholder: 'Selecione canais de texto/voz',
            minValues: 1,
            maxValues: 2,
            channelTypes: [modalV2.channelTypes.GuildText, modalV2.channelTypes.GuildVoice],
          },
          {
            type: 'role-select',
            label: 'Selecionar cargos',
            customId: 'cargos',
            placeholder: 'Selecione 1 ou 2 cargos',
            minValues: 1,
            maxValues: 2,
          },
        ])
        .build();

      await interaction.showModal(modal);
    } catch (error) {
      await interaction.reply({
        content: `❌ Falha ao abrir modal v2: ${error?.message || error}`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
      return;
    }

    const modalSubmit = await interaction
      .awaitModalSubmit({
        time: 120000,
        filter: (submitted) => submitted.customId === customId && submitted.user.id === interaction.user.id,
      })
      .catch(() => null);

    if (!modalSubmit) {
      await interaction.followUp({
        content: '⏱️ Tempo do modal expirou (2 minutos).',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
      return;
    }

    const descricao = modalSubmit.fields.getTextInputValue('descricao');
    const users = modalSubmit.fields.getSelectedUsers('usuarios', false);
    const channels = modalSubmit.fields.getSelectedChannels('canais', false);
    const roles = modalSubmit.fields.getSelectedRoles('cargos', false);
    const files = modalSubmit.fields.getUploadedFiles('arquivos', false);

    const usersTxt = users?.size ? users.map((u) => `<@${u.id}>`).join(', ') : 'nenhum';
    const channelsTxt = channels?.size ? channels.map((c) => `<#${c.id}>`).join(', ') : 'nenhum';
    const rolesTxt = roles?.size ? roles.map((r) => `<@&${r.id}>`).join(', ') : 'nenhum';
    const filesTxt = files?.size
      ? files.map((f) => `[${f.name}](${f.url})`).join(', ')
      : 'nenhum';

    await modalSubmit.reply({
      flags: MessageFlags.Ephemeral,
      content: [
        '✅ Modal enviado com sucesso!',
        '',
        `**Descrição**: ${descricao}`,
        `**Usuários**: ${usersTxt}`,
        `**Canais**: ${channelsTxt}`,
        `**Cargos**: ${rolesTxt}`,
        `**Arquivos**: ${filesTxt}`,
      ].join('\n'),
    });
  },
}).toJSON();
