import { reportError } from "#base/errors"
import type { EventData } from "#base/discord/protocols/event"
import { logger } from "#base/logger"
import chalk from "chalk"
import { type Client, type ClientEvents, Collection } from "discord.js"

export class Event<Key extends keyof ClientEvents> {
    private static all: Collection<string, EventData<any>[]> = new Collection()

    private static registered = new WeakSet<Client>()

    constructor(data: EventData<Key>) {
        if (!Event.all.has(data.name)) {
            Event.all.set(data.name, [])
        }

        Event.all.get(data.name)!.push(data)

        logger.log(
            chalk.green(
                `☉ Event ${chalk.gray(">")} ${chalk.yellow.underline(data.name)} ✓`
            )
        )
    }

    public static register(client: Client) {
        if (Event.registered.has(client)) return
        Event.registered.add(client)
        Event.all.forEach((handlers, name) => {
            handlers.forEach(({ run, once }) => {
                const safeRun = async (...args: any[]) => {
                    try {
                        await run(...args)
                    } catch (error) {
                        await reportError(error, "Evento " + name, name === "clientReady")
                    }
                }

                if (once) client.once(name, safeRun)
                else client.on(name, safeRun)
            })
        })
    }
}
