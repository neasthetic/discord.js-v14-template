import rawSettings from "#settings" with { type: "json" }
import { z } from "zod"

const schema = z.object({
    servers: z.array(z.string().regex(/^\d+$/)).default([]),
    useDatabase: z.boolean().default(false),
    identity: z.object({
        activities: z.array(z.string().min(1)).min(1),
        intervalMs: z.number().int().min(1000).default(10000),
        type: z.enum(["Playing", "Streaming", "Listening", "Watching", "Competing", "Custom"]),
        status: z.enum(["online", "idle", "dnd", "invisible"]),
        url: z.string().url().optional()
    }).refine(value => value.type !== "Streaming" || Boolean(value.url), {
        message: "Streaming exige identity.url"
    })
})

export const settings = schema.parse(rawSettings)
