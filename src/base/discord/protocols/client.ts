import type { ClientOptions } from "discord.js"

export type Options = {
    workdir: string
    directories?: string[]
} & Partial<ClientOptions>
