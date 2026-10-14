import type { MaybeString } from "#base/protocols/misc"
import {
    channelMention,
    type GuildBasedChannel,
    Role,
    roleMention,
    User,
    userMention
} from "discord.js"

export const plural = (value: number, asset: string = "s") =>
    value === 1 ? "" : asset

export const isBun = "Bun" in globalThis

export const runtimeVersion = process.versions.bun ?? process.versions.node

export function formatedMention<
    T extends GuildBasedChannel | Role | User | undefined | null
>(reference: T, altText: string = ""): string {
    return reference instanceof Role
        ? roleMention(reference.id)
        : reference instanceof User
          ? userMention(reference.id)
          : reference
            ? channelMention(reference.id)
            : altText
}

const nonNullish = (v: unknown): boolean => {
    return v !== null && v !== undefined
}

export function brBuilder(...texts: (MaybeString | MaybeString[])[]): string {
    return texts.flat().filter(nonNullish).join("\n")
}

export function isURL(url: string) {
    const pattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i

    return pattern.test(url)
}
