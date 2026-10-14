import { reportError } from "#base/errors"
import { Collector } from "#base/discord/collector"
import { Command } from "#base/discord/commands"
import { Event } from "#base/discord/events"
import type { Options } from "#base/discord/protocols/client"
import { env } from "#base/env"
import { loadDirectory } from "#base/load"
import { Client, GatewayIntentBits } from "discord.js"
import { resolve } from "node:path"

export async function createClient({ workdir, directories = [], ...options }: Options) {
    const client = new Client({ intents: [GatewayIntentBits.Guilds], ...options })
    try {
        client.on("interactionCreate", async interaction => {
            try {
                if (interaction.isCommand()) await Command.run(interaction)
                else if (interaction.isAutocomplete()) await Command.autocomplete(interaction)
                else await Collector.run(interaction)
            } catch (error) {
                await reportError(error, interaction.isAutocomplete() ? "Autocomplete /" + interaction.commandName : "Interação Discord")
            }
        })
        client.on("error", error => { void reportError(error, "Cliente Discord", true) })
        client.on("shardError", (error, shardId) => { void reportError(error, "Shard " + shardId, true) })
        await loadDirectory(resolve(workdir, "discord/_base"))
        await loadDirectory(resolve(workdir, "discord/modules"))
        for (const directory of directories) await loadDirectory(resolve(workdir, directory))
        Event.register(client)
        await client.login(env.DISCORD_TOKEN)
        return client
    } catch (error) {
        await client.destroy()
        throw error
    }
}
