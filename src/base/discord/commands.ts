import { reportError } from "#base/errors"
import { respondError } from "#base/discord/respond"
import type { CommandData } from "#base/discord/protocols/command"
import { logger } from "#base/logger"
import { plural } from "#base/misc"
import { settings } from "#base/settings"
import chalk from "chalk"
import {
    ApplicationCommandType,
    type AutocompleteInteraction,
    type Client,
    Collection,
    type CommandInteraction
} from "discord.js"

export class Command<
    N extends string,
    T extends ApplicationCommandType,
    D extends boolean = false
> {
    private static all: Collection<string, CommandData<any, any, any>> =
        new Collection()

    constructor(data: CommandData<N, T, D>) {
        data.direct ??= false as D
        const key = data.type + ":" + data.name
        if (Command.all.has(key)) throw new Error("Comando duplicado: " + key)
        Command.all.set(key, data)

        if (data.type === ApplicationCommandType.ChatInput)
            logger.log(
                chalk.green(
                    `{/} Slash command ${chalk.gray(">")} ${chalk.blue.underline(data.name)} ✓`
                )
            )
        else if (data.type === ApplicationCommandType.User)
            logger.log(
                chalk.green(
                    `{═} User context menu ${chalk.gray(">")} ${chalk.blue.underline(data.name)} ✓`
                )
            )
        else if (data.type === ApplicationCommandType.Message)
            logger.log(
                chalk.green(
                    `{═} Message context menu ${chalk.gray(">")} ${chalk.blue.underline(data.name)} ✓`
                )
            )
    }

    public static async register(client: Client) {
        const [globalCommands, guildCommands] = Command.all
            .partition((c) => c.global === true)
            .map((c) => Array.from(c.values()))

        await client.application?.commands
            .set(globalCommands)
            .then((commands) => {
                if (!commands.size) return

                logger.log(
                    chalk.greenBright(
                        `└ ${commands.size} command${plural(commands.size)} successfully registered globally!`
                    )
                )
            })

        for (const [, guild] of client.guilds.cache.filter((c) =>
            (settings.servers || []).includes(c.id)
        )) {
            await guild.commands.set(guildCommands).then((commands) => {
                logger.log(
                    chalk.greenBright(
                        `└ ${commands.size} command${plural(commands.size)} registered in ${chalk.underline(guild.name)} guild successfully!`
                    )
                )
            })
        }
    }

    public static async autocomplete(interaction: AutocompleteInteraction) {
        const command = Command.all.get(ApplicationCommandType.ChatInput + ":" + interaction.commandName)
        if (!command) return
        if (
            (interaction.guild && command.direct) ||
            (!interaction.guild && !command.direct)
        )
            return
        if ("autocomplete" in command && command.autocomplete)
            await command.autocomplete(interaction)
    }

    public static async run(interaction: CommandInteraction) {
        const command = Command.all.get(interaction.commandType + ":" + interaction.commandName)
        if (!command) return
        if (
            (interaction.guild && command.direct) ||
            (!interaction.guild && !command.direct)
        )
            return

        try {
            await command.run(interaction as never)
        } catch (error) {
            await respondError(interaction)
            await reportError(error, "Comando /" + interaction.commandName)
        }
    }

    public static getSize() {
        return Command.all.size
    }
}
