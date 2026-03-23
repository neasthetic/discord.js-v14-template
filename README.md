# discord.js V14 (template)
![Logo](https://camo.githubusercontent.com/8a7f16bf86abeefdd6d264102673110ab28b2024bddd3824ab2621343fb6492f/68747470733a2f2f646973636f72642e6a732e6f72672f7374617469632f6c6f676f2e737667)

Esse é um template modular para bots em Discord.js v14, com o propósito de manter uma estrutura sólida de produção para múltiplos diferentes bots usando a mesma base. Permite adicionar/remover módulos rapidamente, sem afetar o funcionamento geral.

## Vantagens
- **Escalabilidade**: Novos recursos podem ser adicionados sem alteraração no código existente, reduzindo o risco de introduzir bugs, além de facilitar a manutenção do projeto.
- **Reutilização de código**: Módulos podem ser reutilizados em diferentes projetos, economizando tempo e esforço no desenvolvimento de novos bots.
- **Colaboração**: Equipes podem trabalhar em diferentes módulos simultaneamente, sem conflitos, acelerando o desenvolvimento.
- **Facilidade de depuração**: Como cada módulo é independente, é mais fácil identificar e corrigir problemas em partes específicas do código.

## Setup inicial & comandos
```bash
npm install
```

Copie `.env.example` para `.env` e preencha as variáveis obrigatórias. <br>
Os packages já inclusos são somentes essenciais, instale os que achar conveniente para seus módulos.

- `npm run dev` (inicializa junto com nodemon)
- `npm run prod`



## Estrutura do projeto
```
src/
   system/
      loaders/        # Boot e carregamento de módulos
      handler/        # Eventos globais (interaction, erros)
      structures/     # Classes base (ApplicationCommand, PrefixCommand, Event)
      utils/          # Helpers (Logger, Response, etc.)
   modules/
      <Modulo>/
         commands/     # Slash commands
         prefix/       # Comandos por prefixo
         events/       # Eventos do Discord
         schemas/      # Mongoose schemas
         scripts/      # Scripts opcionais
```

## Configuração
Arquivo principal: [src/system/settings.js](src/system/settings.js)

- `BOT_IDENTITY`: define status e activity.
- `COMMANDS.TYPE`: `GLOBAL` ou `GUILD`. (se registrará em todos servidores ou em específicos)
- `COMMANDS.PREFIX_COMMANDS_ENABLED`: habilita/desabilita comandos por prefixo.
- `COMMANDS.PREFIX`: prefixo usado para comandos por mensagem (ex: `!`).
- `COMMANDS.SERVER_GUILDS`: lista de guilds para registro restrito.

## Util ComponentsV2 & Modals

Foi adicionado o util `componentsV2` para facilitar criação de mensagens com **Container + Components V2**.

> Importante: no seu `discord.js`, a flag correta é `MessageFlags.IsComponentsV2`.
> O util já aplica essa flag automaticamente no `build()`.

Acesso:

- `client.componentsV2`
- `global.componentsV2`

Exemplo completo (cobrindo texto simples, seção com botão inline, mídia por URL e por asset, arquivo, separadores, botões e select menu):

```js
const { AttachmentBuilder } = require('discord.js');

const cv2 = client.componentsV2;

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
         customId: 'example_inline_button',
      },
   })
   .addMedia([
      {
         url: 'https://i.ibb.co/chbWMpyC/noback-logo.png',
         description: 'texto alternativo',
         spoiler: true,
      },
      {
         url: 'attachment://57982ac69224423dca8e6d29ace18afa.png',
      },
   ])
   .addFile('attachment://Manual_do_Concurseiro_Cibernetico_por_Gabriel_Nunes_TAF.pdf')
   .addSeparator('small', true)
   .addSeparator('large', true)
   .addButtons([
      { style: 'success', label: 'Jealous Ferret', emoji: { name: '☘️' }, customId: 'btn_success' },
      { style: 'link', label: 'Small Gazelle', url: 'https://google.com' },
      { style: 'danger', label: 'Lovable Bear', emoji: { name: '😍' }, customId: 'btn_danger' },
      { style: 'primary', label: 'Smelly Bear', customId: 'btn_primary' },
      { style: 'secondary', label: 'Sassy Duck', customId: 'btn_secondary' },
   ])
   .addSelectMenu({
      customId: 'select_example',
      placeholder: 'Uma placeholder customizada',
      minValues: 1,
      maxValues: 2,
      options: [
         {
            label: 'Nocturnal Porcupine',
            value: 'value_1',
            description: 'Descrição maluca',
            default: true,
            emoji: { name: '🌻' },
         },
         {
            label: 'Shy Hawk',
            value: 'value_2',
            description: 'Outra descrição.',
         },
         {
            label: 'Agile Gaur',
            value: 'value_3',
         },
      ],
   })
   .addAttachment(new AttachmentBuilder('./assets/57982ac69224423dca8e6d29ace18afa.png'))
   .addAttachment(new AttachmentBuilder('./assets/Manual_do_Concurseiro_Cibernetico_por_Gabriel_Nunes_TAF.pdf'))
   .build();

await interaction.reply(payload); // já inclui MessageFlags.IsComponentsV2
```

Atalhos disponíveis no util:

- `componentsV2.builder()` (fluxo fluente)
- `componentsV2.button(...)`, `componentsV2.selectMenu(...)`, `componentsV2.selectOption(...)`
- `componentsV2.row(...)`, `componentsV2.separator(...)`, `componentsV2.mediaItem(...)`, `componentsV2.mediaGallery(...)`

Comando de exemplo pronto no projeto:

- ` /componentsv2-demo` em [src/modules/Example/commands/componentsv2-demo.js](src/modules/Example/commands/componentsv2-demo.js)

## Como criar um módulo?

Criar um novo módulo é simples e rápido. Basta seguir os passos abaixo:

1. **Crie uma pasta para o módulo** dentro do diretório `src/modules/`.
2. **Adicione subpastas conforme necessário**:
   - `commands/`: Para comandos do tipo slash.
   - `events/`: Para eventos do Discord.
   - `schemas/`: Para esquemas do banco de dados (opcional).
   - `scripts/`: Para scripts adicionais que o módulo possa precisar.

## Comandos (padrão ApplicationCommand)
```js
const ApplicationCommand = require('../../system/structures/ApplicationCommand');

module.exports = new ApplicationCommand({
   command: {
      name: 'ping',
      description: 'Pong',
   },
   run: async (_client, interaction) => interaction.reply('Pong!')
}).toJSON();
```

## Modal atualizado (upload + selects)

Sua versão atual suporta modal com:

- `TextInput`
- `FileUpload`
- `String/User/Role/Channel/Mentionable Select`

Util disponível para construção facilitada:

- `client.modalV2`
- `global.modalV2`

Comando de exemplo pronto:

- `/modal-v2-demo` em [src/modules/Example/commands/modal-v2-demo.js](src/modules/Example/commands/modal-v2-demo.js)

Esse comando já está usando o util `modalV2.builder()`.

Esse comando abre um modal com `TextInput`, `FileUpload`, `UserSelect`, `ChannelSelect` e `RoleSelect`, e no submit lê os dados com:

- `fields.getTextInputValue(customId)`
- `fields.getUploadedFiles(customId, required?)`
- `fields.getSelectedUsers(customId, required?)`
- `fields.getSelectedChannels(customId, required?)`
- `fields.getSelectedRoles(customId, required?)`

## Comandos por Prefixo (padrão PrefixCommand)
```js
const PrefixCommand = require('../../system/structures/PrefixCommand');

module.exports = new PrefixCommand({
   name: 'ping',
   aliases: ['p'],
   run: async (_client, message) => message.reply('Pong!')
}).toJSON();
```

## Eventos (padrão Event)
```js
const Event = require('../../system/structures/Event');

module.exports = new Event({
   event: 'clientReady',
   once: true,
   run: (_client, client) => {
      console.log(`Logged as ${client.user.tag}`);
   }
}).toJSON();
```
