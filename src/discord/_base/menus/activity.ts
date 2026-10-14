import { settings } from "#base/settings"
import { ActivityType, type Client } from "discord.js"

export function setupActivity(client: Client) {
    const { activities, type, status, url, intervalMs } = settings.identity
    let index = 0
    const update = () => {
        if (!client.user) return
        const name = activities[index].replaceAll("[USERS]", String(client.users.cache.size))
        client.user.setPresence({
            status,
            activities: [{
                name,
                type: ActivityType[type],
                ...(type === "Custom" ? { state: name } : {}),
                ...(type === "Streaming" ? { url } : {})
            }]
        })
        index = (index + 1) % activities.length
    }
    update()
    if (activities.length === 1) return () => {}
    const timer = setInterval(update, intervalMs)
    timer.unref()
    return () => clearInterval(timer)
}
