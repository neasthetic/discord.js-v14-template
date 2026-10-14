import { monitorProcessErrors, reportError } from "#base/errors"
import { disconnect } from "mongoose"

monitorProcessErrors()

try {
    const { Database } = await import("#database/index")
    const { createClient } = await import("#base/discord/app")
    await Database()
    await createClient({ workdir: import.meta.dirname })
} catch (error) {
    await reportError(error, "Inicialização", true)
    await disconnect().catch(error => reportError(error, "Encerramento do MongoDB", true))
    process.exitCode = 1
}
