import { z } from "zod"
import { isDiscordWebhook } from "#base/errors"

export const env = z.object({
    DISCORD_TOKEN: z.string({ required_error: "Token não informado" }).trim().min(1, "Token não informado"),
    MONGO_URL: z.preprocess(value => value === "" ? undefined : value, z.string().min(1).optional()),
    ERROR_WEBHOOK_URL: z.preprocess(
        value => typeof value === "string" && !value.trim() ? undefined : value,
        z.string().trim().refine(isDiscordWebhook, "Use uma URL HTTPS de webhook do Discord").optional()
    )
}).parse(process.env)
