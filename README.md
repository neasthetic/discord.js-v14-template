# DiscordBOT (Base)

Base modular para bots em Discord.js v14, criada para manter uma estrutura sólida de produção para múltiplos bots usando a mesma base. A proposta é permitir adicionar/remover módulos rapidamente, sem afetar o funcionamento geral do bot.

Inclui um sistema de anticrash completo com descritivo do problema para reduzir falhas críticas que desliguem o bot, além de manter estabilidade em produção.

## Requisitos
- Node.js 18+
- MongoDB (opcional, se DATABASE.ENABLE = true)

## Setup
```bash
npm install
```

Copie `.env.example` para `.env` e preencha as variáveis obrigatórias.

## Scripts
- `npm run dev` (nodemon)
- `npm run prod`

## Estrutura
```
src/
   system/
      loaders/        # Boot e carregamento de módulos
      handler/        # Eventos globais (interaction, erros)
      structures/     # Classes base (ApplicationCommand, Event)
      utils/          # Helpers (Logger, Response, etc.)
   modules/
      <Modulo>/
         commands/     # Slash commands
         events/       # Eventos do Discord
         schemas/      # Mongoose schemas
         scripts/      # Scripts opcionais
```

## Configuração
Arquivo principal: [src/system/settings.js](src/system/settings.js)

- `BOT_IDENTITY`: define status e activity.
- `COMMANDS.TYPE`: `GLOBAL` ou `GUILD`.
- `COMMANDS.SERVER_GUILDS`: lista de guilds para registro restrito.

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

## Registro de comandos
- `GLOBAL`: propaga para todos os servidores (pode demorar até 1h).
- `GUILD`: registra somente nos IDs de `COMMANDS.SERVER_GUILDS`.

## Por que usar uma base modular?

A modularidade é um dos principais pilares desta base. Isso significa que cada funcionalidade do bot pode ser desenvolvida como um módulo independente, contendo seus próprios comandos, eventos, esquemas de banco de dados e scripts. Essa abordagem oferece diversas vantagens:

- **Escalabilidade**: A modularidade permite que novos recursos sejam adicionados ao bot sem a necessidade de alterar o código existente. Isso reduz o risco de introduzir bugs e facilita a manutenção do projeto.
- **Reutilização de código**: Módulos podem ser reutilizados em diferentes projetos, economizando tempo e esforço no desenvolvimento de novos bots.
- **Colaboração**: Equipes podem trabalhar em diferentes módulos simultaneamente, sem conflitos, acelerando o desenvolvimento.
- **Facilidade de depuração**: Como cada módulo é independente, é mais fácil identificar e corrigir problemas em partes específicas do código.

## Sistema de Anticrash

O sistema de anticrash integrado foi projetado para garantir a estabilidade do bot em produção. Ele captura erros críticos e os registra, evitando que o bot seja desligado inesperadamente. Além disso, o sistema de anticrash pode enviar informações detalhadas sobre os erros para um Webhook configurado no arquivo `.env`. Isso permite que os desenvolvedores sejam notificados imediatamente sobre qualquer problema, facilitando a resolução rápida e eficiente.

### Configuração do Webhook
No arquivo `.env`, configure a URL do Webhook para receber notificações de erros:

```
WEBHOOK_URL=https://seu-webhook-url
```

Quando um erro crítico ocorre, o sistema de anticrash envia uma mensagem para o Webhook com detalhes como:
- Tipo de erro
- Mensagem de erro
- Stack trace
- Data e hora do erro

## Como criar um módulo?

Criar um novo módulo é simples e rápido. Basta seguir os passos abaixo:

1. **Crie uma pasta para o módulo** dentro do diretório `src/modules/`.
2. **Adicione subpastas conforme necessário**:
   - `commands/`: Para comandos do tipo slash.
   - `events/`: Para eventos do Discord.
   - `schemas/`: Para esquemas do banco de dados (opcional).
   - `scripts/`: Para scripts adicionais que o módulo possa precisar.
3. **Implemente os comandos e eventos** usando as classes `ApplicationCommand` e `Event` disponíveis em `src/system/structures/`.
4. **Exemplo de comando**:

```js
const ApplicationCommand = require('../../system/structures/ApplicationCommand');

module.exports = new ApplicationCommand({
   command: {
      name: 'exemplo',
      description: 'Este é um comando de exemplo',
   },
   run: async (_client, interaction) => {
      interaction.reply('Este é um exemplo de comando!');
   }
}).toJSON();
```

5. **Exemplo de evento**:

```js
const Event = require('../../system/structures/Event');

module.exports = new Event({
   event: 'messageCreate',
   run: (_client, message) => {
      if (message.content === '!ping') {
         message.reply('Pong!');
      }
   }
}).toJSON();
```

6. **Teste o módulo** executando o bot em modo de desenvolvimento:

```bash
npm run dev
```

7. **Adicione o módulo ao controle de versão** para compartilhá-lo com sua equipe ou reutilizá-lo em outros projetos.
