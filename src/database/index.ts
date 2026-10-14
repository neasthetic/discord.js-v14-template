import { env } from "#base/env"
import { logger } from "#base/logger"
import { settings } from "#base/settings"
import { connect } from "mongoose"

export async function Database() {
    if (!settings.useDatabase) return
    if (!env.MONGO_URL) throw new Error("MONGO_URL e obrigatorio quando useDatabase esta habilitado")
    await connect(env.MONGO_URL, { connectTimeoutMS: 8000, serverSelectionTimeoutMS: 8000 })
    logger.success("MongoDB conectado")
}
