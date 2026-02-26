const ApplicationCommand = require('../../../system/structures/ApplicationCommand');
const { ApplicationCommandType } = require('discord.js');

const SAMPLE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7S6kQAAAAASUVORK5CYII=';

module.exports = new ApplicationCommand({
  command: {
    name: 'componentsv2-demo',
    description: 'Demonstra todas as features do utils ComponentsV2.',
    type: ApplicationCommandType.ChatInput,
  },

  run: async (client, interaction) => {
    const cv2 = client.componentsV2 || global.componentsV2;
    const appemoji = client.appemoji || global.appemoji;

    const payload = cv2
      .builder()
      .setAccentColor(16712451)
      .addText('Conteúdo normal simples.')
      .addSection({
        texts: [
          'Conteúdo com botão e componente em linha (linha 1).',
          'Conteúdo com botão e componente em linha (linha 2).',
        ],
        button: {
          style: 'secondary',
          label: 'Fierce Meerkat',
          emoji: { name: '😀' },
          customId: 'cv2_demo_inline_button',
        },
      })
      .addMedia([
        {
          url: 'https://i.ibb.co/chbWMpyC/noback-logo.png',
          description: 'texto alternativo',
          spoiler: true,
        },
        {
          url: 'attachment://cv2-asset.png',
        },
      ])
      .addFile('attachment://Manual_do_Concurseiro_Cibernetico.txt')
      .addSeparator('small', true)
      .addSeparator('large', true)
      .addButtons([
        {
          style: 'success',
          label: 'Jealous Ferret',
          emoji: { name: '☘️' },
          customId: 'cv2_demo_btn_success',
        },
        {
          style: 'link',
          label: 'Small Gazelle',
          url: 'https://google.com',
        },
        {
          style: 'danger',
          label: 'Lovable Bear',
          emoji: { name: '😍' },
          customId: 'cv2_demo_btn_danger',
        },
        {
          style: 'primary',
          label: 'Smelly Bear',
          customId: 'cv2_demo_btn_primary',
        },
        {
          style: 'secondary',
          label: 'Sassy Duck',
          customId: 'cv2_demo_btn_secondary',
        },
      ])
      .addSelectMenu({
        customId: 'cv2_demo_select',
        placeholder: 'Uma placeholder customizada',
        minValues: 1,
        maxValues: 2,
        options: [
          {
            label: 'Nocturnal Porcupine',
            value: 'cv2_value_1',
            description: 'Descrição maluca',
            default: true,
            emoji: { name: '🌻' },
          },
          {
            label: 'Shy Hawk',
            value: 'cv2_value_2',
            description: 'Outra descrição.',
          },
          {
            label: 'Agile Gaur',
            value: 'cv2_value_3',
          },
        ],
      })
      .addAttachment(Buffer.from(SAMPLE_IMAGE_BASE64, 'base64'), 'cv2-asset.png')
      .addAttachment(
        Buffer.from(
          [
            'Manual do Concurseiro Cibernetico',
            '',
            '- Exemplo de arquivo enviado como attachment para Components V2.',
            '- Este arquivo aparece no FileComponent usando attachment://...',
            '',
            `Emoji util disponível: ${appemoji.success || '✅'}`,
          ].join('\n'),
          'utf8'
        ),
        'Manual_do_Concurseiro_Cibernetico.txt'
      )
      .build();

    await interaction.reply(payload);
  },
}).toJSON();
