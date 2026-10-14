import { Command } from "#base/discord/commands"
import { Event } from "#base/discord/events"
import { logger } from "#base/logger"
import { isBun, runtimeVersion } from "#base/misc"
import chalk from "chalk"
import { version } from "discord.js"
import { setupActivity } from "#discord/_base/menus/activity"

new Event({
    name: "clientReady",
    once: true,
    async run(client) {
        setupActivity(client)

        console.log()
        logger.log(
            `${chalk.hex("#5865F2")("★ discord.js")} ${chalk.dim(version)}`,
            "|",
            `${chalk.hex("#54A044")(isBun ? "★ Bun" : "★ Node.js")} ${chalk.dim(runtimeVersion)}`
        )

        logger.log(
            chalk.greenBright(
                `● ${chalk.hex("#57F287").underline(client.user.username)} online ✓`
            )
        )

        await Command.register(client)
    }
})
