# Discord.js v14 — Template modular
![Logo](https://camo.githubusercontent.com/8a7f16bf86abeefdd6d264102673110ab28b2024bddd3824ab2621343fb6492f/68747470733a2f2f646973636f72642e6a732e6f72672f7374617469632f6c6f676f2e737667)
Base para bots Discord em **TypeScript**, com comandos, eventos e componentes organizados por funcionalidade. Os módulos são carregados automaticamente, sem precisar adicioná-los ao núcleo.

## Vantagens

- **Organização por módulo:** comandos, interfaces e serviços de uma funcionalidade ficam juntos.
- **Contratos tipados:** `Command`, `Event` e `Collector` definem como registrar handlers.
- **Configuração centralizada:** presença, servidores e emojis ficam em `src/config`.
- **Banco opcional:** o bot funciona sem MongoDB; quando habilitado, a conexão precede os módulos.
- **Tratamento de erros:** respostas de erro respeitam interações já respondidas ou adiadas.

## Setup inicial

Requisitos: **Node.js 22 ou superior**, npm e um bot criado no Discord Developer Portal.

```powershell
npm install
Copy-Item .env.example .env
```

Preencha o token no `.env`:

```dotenv
DISCORD_TOKEN="seu-token"
MONGO_URL=""
```

Edite [src/config/settings.json](src/config/settings.json) e inicie:

```powershell
npm run dev
```

Convide o bot ao servidor com os escopos `bot` e `applications.commands` e as permissões exigidas pelos módulos. Comandos locais precisam de IDs em `servers`; comandos globais usam `global: true`.

### Comandos disponíveis

| Comando | Função |
| --- | --- |
| `npm run dev` | Executa `src` usando `.env` |
| `npm run watch` | Reinicia ao alterar o código |
| `npm run build` | Limpa `build` e compila código e JSONs |
| `npm start` | Executa o build usando `.env` |
| `npm run check` | Verifica os tipos do código de produção |
| `npm test` | Executa testes de regressão |
| `npm run lint` | Verifica o código com ESLint |
| `npm run format` | Executa ESLint e formata com Prettier |

As variantes `dev:dev`, `watch:dev` e `start:dev` usam `.env.dev`. Os JSONs são os mesmos nos dois ambientes.

Para produção:

```powershell
npm run build
npm start
```

O TypeScript copia os JSONs importados para `build/config`. Ao editar configurações ou remover módulos, reconstrua e reinicie a versão de produção. Para distribuir o bot, inclua `build`, `package.json` e `package-lock.json`, instale as dependências de produção e configure o `.env` no destino.

## Estrutura do projeto

```text
src/
  config/
    settings.json         # Servidores, banco e presença
    emojis.json           # Catálogo de IDs de emojis
  base/
    discord/
      app.ts              # Cliente e inicialização
      commands.ts         # Comandos slash e de contexto
      collector.ts        # Botões, selects e modais
      events.ts           # Eventos do Discord
      respond.ts          # Resposta de erro compartilhada
      protocols/          # Tipos dos handlers
    protocols/            # Tipos dos helpers
    components.ts         # Components V2
    modal.ts              # Construção e leitura de modais
    label.ts              # Labels de modais
    emoji.ts              # Acesso ao catálogo de emojis
    settings.ts           # Leitura e validação das configurações
    env.ts                # Validação do ambiente
    load.ts               # Carregamento recursivo
    logger.ts             # Logs
    misc.ts               # Utilidades
    store.ts              # Armazenamento em memória com expiração
  database/
    index.ts              # Conexão opcional com MongoDB
  discord/
    _base/                # Inicialização e presença do bot
    modules/
      <Modulo>/           # Funcionalidade adicionada por você
  server.ts               # Entrada da aplicação

tests/                    # Testes da base
```

## Configuração

Arquivo editável: [src/config/settings.json](src/config/settings.json). O helper `src/base/settings.ts` lê e valida esse arquivo.

```json
{
    "servers": ["ID_DO_SERVIDOR"],
    "useDatabase": false,
    "identity": {
        "status": "online",
        "type": "Custom",
        "activities": [
            "👀 Gerenciando [USERS] usuários",
            "🤔 Dúvidas? Abra um ticket!"
        ],
        "intervalMs": 10000
    }
}
```

Substitua `ID_DO_SERVIDOR` por um ID numérico real. Use `[]` se não precisar registrar comandos locais.

### Presença e atividades

| Campo | Valores e comportamento |
| --- | --- |
| `servers` | IDs dos servidores onde registrar comandos locais |
| `useDatabase` | Habilita ou desabilita o MongoDB |
| `identity.status` | `online`, `dnd` (ocupado), `idle` (ausente), `invisible` |
| `identity.type` | `Custom`, `Playing`, `Streaming`, `Listening`, `Watching`, `Competing` |
| `identity.activities` | Uma ou mais frases exibidas em sequência |
| `identity.intervalMs` | Intervalo em milissegundos; mínimo de 1000, padrão de 10000 |
| `identity.url` | URL obrigatória quando o tipo é `Streaming` |

A primeira frase aparece imediatamente. `[USERS]` é recalculado a cada exibição a partir dos usuários no cache do bot; não representa necessariamente todos os membros dos servidores. Com uma única frase, a atividade fica fixa.

Para transmitir, configure `type: "Streaming"` e `url`, por exemplo `"https://www.twitch.tv/seu_canal"`.

### MongoDB

Defina `useDatabase: true` e preencha `MONGO_URL` no `.env`. A conexão é aguardada antes dos módulos; uma falha interrompe a inicialização. Modelos e schemas de cada funcionalidade devem ficar dentro de seu módulo.

### Emojis

O [src/config/emojis.json](src/config/emojis.json) preserva os IDs existentes e organiza os emojis em `static` e `animated`.

```ts
import { icon } from "#base/emoji"

const texto = `${icon.confirm} Operação concluída!`
const id = icon.confirm.id
```

Use `String(icon.confirm)` no texto ou `icon.confirm` no campo de emoji de um componente. As chaves são inferidas do JSON; mantenha os IDs como strings.

## Como criar um módulo?

1. Crie uma pasta em `src/discord/modules`.
2. Organize os arquivos conforme a funcionalidade precisar.
3. Registre comandos com `new Command`, eventos com `new Event` e componentes com `new Collector`.

Exemplo de organização:

```text
src/discord/modules/MinhaFeature/
  commands.ts       # Comandos
  collectors.ts     # Botões, selects e modais
  events.ts         # Eventos
  menus.ts          # Mensagens e interfaces
  services.ts       # Regras e integrações
  db.ts             # Modelos de banco, quando necessários
```

Esses nomes são convenções, não exigências. Uma funcionalidade pequena pode ficar em um único arquivo. O loader percorre subpastas e importa arquivos `.ts` em desenvolvimento e `.js` no build; arquivos `.d.ts` são ignorados. Helpers podem exportar funções normalmente.

Configurações específicas devem ser validadas pelo próprio módulo. Se ele depender de outro módulo, documente a dependência e ajuste seus consumidores antes de removê-la.

Para remover uma funcionalidade, exclua sua pasta, reconstrua e reinicie. Não há recarga de módulos em tempo de execução. A exclusão de arquivos não apaga dados persistidos no MongoDB.

## Comandos slash e de contexto

Exemplo em `src/discord/modules/ping/commands.ts`:

```ts
import { Command } from "#base/discord/commands"
import { ApplicationCommandType } from "discord.js"

new Command({
    name: "ping",
    description: "Responde com pong.",
    type: ApplicationCommandType.ChatInput,
    global: true,
    async run(interaction) {
        await interaction.reply("Pong!")
    }
})
```

- `global: true`: registra globalmente.
- `global` ausente ou `false`: registra nos servidores de `settings.servers`.
- `direct: true`: o handler atende somente mensagens diretas; configure também o contexto permitido no Discord quando necessário.

Comandos com o mesmo nome e tipo são rejeitados. Tipos distintos podem compartilhar um nome. A sincronização envia listas vazias quando necessário para remover comandos antigos nos escopos configurados. Para comandos de contexto, use `ApplicationCommandType.User` ou `ApplicationCommandType.Message`.

## Botões, selects e modais

O `Collector` registra handlers por tipo e `customId`. Parâmetros usam segmentos `:nome`; listas usam `:[nome]`.

```ts
import { Collector } from "#base/discord/collector"
import { CollectorType } from "#base/discord/protocols/collector"

new Collector({
    id: "example/confirm/:userId",
    type: CollectorType.Button,
    async run(interaction, { userId }) {
        await interaction.reply({
            content: `Usuário selecionado: ${userId}`,
            flags: "Ephemeral"
        })
    }
})
```

Um botão com `customId: "example/confirm/123"` fornece `userId: "123"`. Valide permissões e a identidade do usuário no handler; parâmetros de IDs não concedem autorização.

Há tipos específicos para botões, selects e modais, além de `Select`, `Row` e `All` para handlers genéricos. Handlers específicos têm prioridade. IDs repetidos dentro do mesmo tipo são rejeitados.

## Components V2

Use os helpers de [src/base/components.ts](src/base/components.ts) dentro de um handler:

```ts
import { createComponents, createContainer } from "#base/components"
import { MessageFlags } from "discord.js"

await interaction.reply({
    flags: MessageFlags.IsComponentsV2,
    components: createComponents(
        createContainer("Blurple", "Olá! Esta mensagem usa Components V2.")
    )
})
```

A flag `IsComponentsV2` deve ser informada no envio. Os helpers criam containers, textos, rows, botões de link, seções, separadores, galerias, thumbnails e arquivos.

## Modais

Use `createLabel` e `createTextInput` dentro de um handler de comando ou componente:

```ts
import { createLabel } from "#base/label"
import { createTextInput } from "#base/modal"
import { ModalBuilder } from "discord.js"

const modal = new ModalBuilder()
    .setCustomId("example/form")
    .setTitle("Seu formulário")
    .addLabelComponents(
        createLabel("Nome", createTextInput({
            customId: "name",
            required: true
        }))
    )

await interaction.showModal(modal)
```

Registre o envio do formulário separadamente:

```ts
import { Collector } from "#base/discord/collector"
import { CollectorType } from "#base/discord/protocols/collector"

new Collector({
    id: "example/form",
    type: CollectorType.Modal,
    async run(interaction) {
        const nome = interaction.fields.getTextInputValue("name")
        await interaction.reply({ content: `Olá, ${nome}!`, flags: "Ephemeral" })
    }
})
```

Também estão disponíveis `createFileUpload` e `modalFieldsToRecord` em `src/base/modal.ts`.

## Eventos

```ts
import { Event } from "#base/discord/events"

new Event({
    name: "clientReady",
    once: true,
    async run(client) {
        console.log(`Conectado como ${client.user.tag}`)
    }
})
```

O cliente usa apenas `GatewayIntentBits.Guilds` por padrão. Módulos que precisem de mensagens, membros ou outros eventos devem configurar os intents em `createClient`, no `src/server.ts`, e habilitar os intents privilegiados correspondentes no Discord Developer Portal.

## Alertas de erros

Para receber alertas, crie um webhook no canal de logs do Discord e configure sua URL no `.env`:

```dotenv
ERROR_WEBHOOK_URL="https://discord.com/api/webhooks/ID/TOKEN"
```

Substitua a URL de exemplo pela URL real do webhook. Deixe o campo vazio para manter apenas os logs locais. O webhook funciona mesmo antes do login do bot; sua URL não deve ficar no `settings.json` nem ser versionada.

Cada alerta contém **causa**, **origem** (inicialização, evento, comando ou componente) e **arquivo/linha**, quando disponíveis. Causas encadeadas são resumidas a partir do erro original. Configurações inválidas mostram o campo que precisa de correção. Tokens e credenciais conhecidos no ambiente são ocultados; a stack completa fica somente no console.

Falhas de inicialização, cliente, shards e erros não tratados recebem o título **Erro crítico no bot**. Falhas capturadas em comandos, componentes e demais eventos recebem **Falha no bot**. Mensagens repetidas são suprimidas por 60 segundos. O envio tem timeout de 3 segundos, não dispara menções e respeita o período de espera informado pelo Discord em uma resposta HTTP 429. Não há fila de reenvio: alertas bloqueados por esse limite ficam somente no console.

O anticrash captura exceções e promises não tratadas, registra o erro e tenta enviar o alerta sem encerrar o processo. O monitoramento continua ativo para erros posteriores. A operação que falhou não é repetida automaticamente; o restante do bot continua executando. Falhas que impedem a inicialização, como token ausente ou configuração inválida, ainda impedem que o bot conecte ao Discord.

Módulos podem informar uma falha explicitamente:

```ts
import { reportError } from "#base/errors"

try {
    // Execute a operação do módulo.
} catch (error) {
    await reportError(error, "MeuModulo: sincronização", true)
}
```

O terceiro argumento marca o alerta como crítico; ele não encerra o processo. Evite reportar novamente um erro que será lançado para um handler já monitorado.

## Verificação e versionamento

```powershell
npm run check
npm test
npm run lint
npm run build
```

Os testes usam interações simuladas e não conectam ao Discord nem ao MongoDB.

O `.gitignore` exclui dependências, build, arquivos de ambiente, logs, relatórios e preferências locais. **Versione `src/config`, `tests`, `.env.example` e `package-lock.json`**. Tokens e credenciais ficam no `.env`.
