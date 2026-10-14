import type { ClientEvents } from "discord.js"

export type EventData<Key extends keyof ClientEvents> = {
    name: Key
    once?: boolean
    run(...args: ClientEvents[Key]): Promise<any>
}
