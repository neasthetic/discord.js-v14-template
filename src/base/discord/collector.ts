import { reportError } from "#base/errors"
import { respondError } from "#base/discord/respond"
import { type CollectorData, type CollectorSubitem, CollectorType } from "#base/discord/protocols/collector"
import { logger } from "#base/logger"
import { type CacheType, Collection, type Interaction } from "discord.js"

export function getCustomIdParams(definition: string, id: string) {
    const names: string[] = []
    const pattern = definition.split("/").map(segment => {
        if (segment.startsWith(":")) {
            names.push(segment.slice(1))
            return "([^/]+)"
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }).join("/")
    const match = new RegExp("^" + pattern + "$").exec(id)
    if (!match) return null
    const params: Record<string, string | string[]> = {}
    names.forEach((name, index) => {
        const value = match[index + 1]
        if (name.startsWith("[") && name.endsWith("]")) params[name.slice(1, -1)] = value.split(",").filter(Boolean)
        else params[name] = value
    })
    return params
}

export class Collector<I extends string, T extends CollectorType, C extends CacheType = CacheType> {
    private static all: Collection<CollectorType, CollectorSubitem> = new Collection()

    constructor(data: CollectorData<I, T, C>) {
        const suball = Collector.all.get(data.type) ?? new Collection()
        if (suball.has(data.id)) throw new Error("Componente duplicado: " + data.type + ":" + data.id)
        suball.set(data.id, data)
        Collector.all.set(data.type, suball)
        logger.success("Componente registrado:", data.type, data.id)
    }

    public static async run(interaction: Interaction) {
        if (!interaction.isButton() && !interaction.isAnySelectMenu() && !interaction.isModalSubmit()) return
        const types: CollectorType[] = []
        if (interaction.isButton()) types.push(CollectorType.Button, CollectorType.Row)
        else if (interaction.isAnySelectMenu()) {
            if (interaction.isStringSelectMenu()) types.push(CollectorType.StringSelect)
            else if (interaction.isChannelSelectMenu()) types.push(CollectorType.ChannelSelect)
            else if (interaction.isRoleSelectMenu()) types.push(CollectorType.RoleSelect)
            else if (interaction.isUserSelectMenu()) types.push(CollectorType.UserSelect)
            else if (interaction.isMentionableSelectMenu()) types.push(CollectorType.MentionableSelect)
            types.push(CollectorType.Select, CollectorType.Row)
        } else {
            if (interaction.isFromMessage()) types.push(CollectorType.ModalComponent)
            types.push(CollectorType.Modal)
        }
        types.push(CollectorType.All)
        for (const type of types) {
            const items = Collector.all.get(type)
            const responder = items?.get(interaction.customId) ?? items?.find(data => getCustomIdParams(data.id, interaction.customId) !== null)
            if (!responder) continue
            try {
                await responder.run(interaction as never, getCustomIdParams(responder.id, interaction.customId) ?? {})
            } catch (error) {
                await respondError(interaction)
                await reportError(error, "Componente " + responder.id)
            }
            return
        }
    }
}
