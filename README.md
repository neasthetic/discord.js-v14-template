# discord.js V14 (template)
![Logo](https://camo.githubusercontent.com/8a7f16bf86abeefdd6d264102673110ab28b2024bddd3824ab2621343fb6492f/68747470733a2f2f646973636f72642e6a732e6f72672f7374617469632f6c6f676f2e737667)

Esse é um template modular para bots em Discord.js v14, montei com o propósito de manter uma estrutura sólida de produção para múltiplos diferentes bots usando a mesma base. A proposta é permitir adicionar/remover módulos rapidamente, sem afetar o funcionamento geral do bot.

## Por que usar uma base modular?
- **Escalabilidade**: A modularidade permite que novos recursos sejam adicionados ao bot sem a necessidade de alterar o código existente. Isso reduz o risco de introduzir bugs e facilita a manutenção do projeto.
- **Reutilização de código**: Módulos podem ser reutilizados em diferentes projetos, economizando tempo e esforço no desenvolvimento de novos bots.
- **Colaboração**: Equipes podem trabalhar em diferentes módulos simultaneamente, sem conflitos, acelerando o desenvolvimento.
- **Facilidade de depuração**: Como cada módulo é independente, é mais fácil identificar e corrigir problemas em partes específicas do código.

## Sistema de Anticrash

O sistema de anticrash integrado foi projetado para garantir a estabilidade do bot em produção. Ele captura erros críticos e os registra, evitando que o bot seja desligado inesperadamente. Além disso, o sistema de anticrash pode enviar informações detalhadas sobre os erros para um Webhook configurado no arquivo `.env`. Isso permite que os desenvolvedores sejam notificados imediatamente sobre qualquer problema, facilitando a resolução rápida e eficiente.

## Requisitos
- Node.js 18+
- MongoDB (opcional, se DATABASE.ENABLE = true)

## Setup Inicial
```bash
npm install
```

Copie `.env.example` para `.env` e preencha as variáveis obrigatórias. <br>
Os packages já inclusos são somentes essenciais, instale os que achar conveniente para seus módulos.

## Scripts
- `npm run dev` (inicializa junto com nodemon)
- `npm run prod`

## Estrutura
```
src/
   system/
      loaders/        # Boot e carregamento de módulos
      handler/        # Eventos globais (interaction, erros)
      structures/     # Classes base (ApplicationCommand, PrefixCommand, Event)
      utils/          # Helpers (Logger, Response, etc.)
      resources/      # Arquivos de recursos (emojis, jsons, etc.)
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

## Util de Emojis

O projeto expõe automaticamente `emojis` no escopo global e em `client.emojis`.

Exemplos de uso:

```js
// Mensagem/Embed (retorna string de emoji pronta: <:nome:id>)
await interaction.reply({ content: `${emojis.facebook} Siga nossa página!` });

const embed = new EmbedBuilder()
   .setDescription(`${emojis.info} Informações do sistema`);

// Botão (retorna objeto compatível com setEmoji)
const button = new ButtonBuilder()
   .setCustomId('social-facebook')
   .setLabel('Facebook')
   .setEmoji(emojis.button.facebook);

// URL original do emojis.json
const iconUrl = emojis.url.facebook;
```

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
