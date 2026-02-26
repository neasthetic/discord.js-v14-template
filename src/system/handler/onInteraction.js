const { MessageFlags } = require("discord.js");
const Logger = require('../utils/Logger');

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        await handleAutocomplete(client, interaction);
      } else if (interaction.isCommand() || interaction.isChatInputCommand()) {
        await handleSlash(client, interaction);
      } else if (interaction.isButton()) {
        await handleComponent(client.buttons, "[BUTTON]", interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleComponent(client.menus, "[MENU]", interaction);
      } else if (interaction.isModalSubmit()) {
        await handleComponent(client.modals, "[MODAL]", interaction);
      }
    } catch (err) {
      Logger.error("(INTERACTION) Falha inesperada:", err);
    }
  });
};

const handleSlash = async (client, interaction) => {
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.run(client, interaction);
  } catch (err) {
    Logger.error(`(SLASH) Erro em ${interaction.commandName}:`, err);
    await respond(interaction, "❌ Ocorreu um erro ao executar este comando.");
  }
};

const handleAutocomplete = async (client, interaction) => {
  const command = client.slashCommands.get(interaction.commandName);
  if (!command || typeof command.autocomplete !== "function") return;

  try {
    await command.autocomplete(interaction);
  } catch (err) {
    Logger.error(`(AUTOCOMPLETE) Erro em ${interaction.commandName}:`, err);
  }
};

const handleComponent = async (registry, label, interaction) => {
  // Tenta match exato primeiro
  let handler = registry?.get(interaction.customId);

  // Se não encontrar, tenta encontrar por prefixo (ex: "ticket-close_123" -> handler "ticket-close")
  if (!handler) {
    handler = registry?.find((cmd, key) => interaction.customId.startsWith(key));
  }

  if (!handler) return;

  try {
    await handler.run?.(interaction.client, interaction);
  } catch (err) {
    Logger.error(`${label} Erro em ${interaction.customId}:`, err);
    await respond(interaction, "❌ Erro ao processar a interação.");
  }
};

const respond = async (interaction, content) => {
  const payload = { content, flags: MessageFlags.Ephemeral };
  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply(payload).catch(() => {});
  } else {
    await interaction.followUp(payload).catch(() => {});
  }
};
