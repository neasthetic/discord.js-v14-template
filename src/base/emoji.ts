import emojis from "#emojis" with { type: "json" }
import { formatEmoji } from "discord.js"

type EmojiList = typeof emojis
type IconKey = keyof EmojiList["animated"] | keyof EmojiList["static"]
type IconInfo = { id: string; animated: boolean; toString(): string }

export const icon = Object.create(null) as Record<IconKey, IconInfo>
for (const [group, animated] of [[emojis.static, false], [emojis.animated, true]] as const) {
    for (const [name, id] of Object.entries(group)) {
        Object.assign(icon, { [name]: { id, animated, toString: () => formatEmoji(id, animated) } })
    }
}
