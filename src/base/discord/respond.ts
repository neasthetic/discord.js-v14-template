import { logger } from "#base/logger"
import { MessageFlags, type CommandInteraction, type RepliableInteraction } from "discord.js"

export async function respondError(interaction: RepliableInteraction | CommandInteraction) {
    const payload = { content: "Ocorreu um erro ao realizar esta acao.", flags: MessageFlags.Ephemeral as const }
    try {
        if (interaction.deferred || interaction.replied) await interaction.followUp(payload)
        else await interaction.reply(payload)
    } catch (error) {
        logger.error("Falha ao enviar resposta de erro:", error)
    }
}
