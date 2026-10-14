import { logger } from "#base/logger"
import { ZodError } from "zod"

const sent = new Map<string, number>()
let blockedUntil = 0

export function isDiscordWebhook(value: string) {
    try {
        const url = new URL(value)
        return url.protocol === "https:" &&
            ["discord.com", "discordapp.com", "canary.discord.com", "ptb.discord.com"].includes(url.hostname) &&
            /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+$/.test(url.pathname) &&
            !url.username && !url.password
    } catch { return false }
}

function redact(value: string) {
    for (const [name, secret] of Object.entries(process.env)) {
        if (secret && /TOKEN|SECRET|PASSWORD|API_KEY|WEBHOOK|MONGO/i.test(name)) {
            value = value.split(secret).join("[oculto]")
        }
    }
    return value
        .replace(/https?:\/\/[^\s]+\/webhooks\/[^\s]+/gi, "[webhook oculto]")
        .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[MongoDB oculto]")
        .replace(/Bearer\s+[^\s]+/gi, "Bearer [oculto]")
        .replace(/(\b(?:token|password|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi, "$1[oculto]")
        .replace(/`/g, "'")
}

export function summarizeError(error: unknown, origin: string, critical = false) {
    let root = error
    const visited = new Set<unknown>()
    while (root instanceof Error && root.cause !== undefined && !visited.has(root.cause)) {
        visited.add(root)
        root = root.cause
    }
    const message = root instanceof ZodError
        ? "Configuração inválida: " + root.issues.slice(0, 3).map(issue => issue.path.join(".") + ": " + issue.message).join("; ")
        : root instanceof Error ? root.name + ": " + root.message : String(root)
    const stack = root instanceof Error ? root.stack : error instanceof Error ? error.stack : undefined
    const location = stack?.replaceAll("\\", "/").match(/(?:src|build)\/[^\n)]+:\d+:\d+/)?.[0]
    return {
        allowed_mentions: { parse: [] },
        embeds: [{
            title: critical ? "Erro crítico no bot" : "Falha no bot",
            color: critical ? 0xed4245 : 0xfee75c,
            fields: [
                { name: "Causa", value: redact(message).replace(/\s+/g, " ").slice(0, 500) || "Sem mensagem" },
                { name: "Origem", value: redact(origin).slice(0, 300) || "Não informada" },
                { name: "Arquivo", value: redact(location ?? "Não disponível").slice(0, 300) }
            ],
            timestamp: new Date().toISOString()
        }]
    }
}

export async function reportError(error: unknown, origin: string, critical = false) {
    logger.error(origin + ":", error)
    const url = process.env.ERROR_WEBHOOK_URL?.trim()
    if (!url) return
    if (!isDiscordWebhook(url)) {
        logger.warn("ERROR_WEBHOOK_URL inválida; use uma URL HTTPS de webhook do Discord")
        return
    }
    const body = summarizeError(error, origin, critical)
    const fingerprint = JSON.stringify([critical, body.embeds[0].fields])
    const now = Date.now()
    for (const [key, time] of sent) if (now - time >= 60_000) sent.delete(key)
    if (now < blockedUntil || sent.has(fingerprint)) return
    if (sent.size >= 100) sent.delete(sent.keys().next().value!)
    sent.set(fingerprint, now)
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(3000)
        })
        if (response.status === 429) {
            const data = await response.json() as { retry_after?: number }
            const retryAfter = Number(data.retry_after)
            blockedUntil = Date.now() + (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000)
        }
        if (!response.ok) throw new Error("Webhook respondeu HTTP " + response.status)
    } catch {
        sent.delete(fingerprint)
        logger.warn("Não foi possível enviar o alerta ao webhook; o erro foi registrado no console")
    }
}

export function monitorProcessErrors() {
    const handle = (error: unknown, origin: string) => {
        void reportError(error, origin, true).catch(() => {
            logger.warn("Falha ao registrar erro no anticrash")
        })
    }
    const rejection = (error: unknown) => handle(error, "Promise não tratada")
    const exception = (error: Error) => handle(error, "Exceção não tratada")
    process.on("unhandledRejection", rejection)
    process.on("uncaughtException", exception)
    return () => {
        process.off("unhandledRejection", rejection)
        process.off("uncaughtException", exception)
    }
}
