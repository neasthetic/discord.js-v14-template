const isDevMode = String(process.env.DEV_MODE || '').toLowerCase() === 'true';

module.exports = {
    
    USE_DATABASE: true, // Requer MONGODB_URI no .env
    
    BOT_IDENTITY: {
        ACTIVITY_TYPE: "Streaming", // Playing | Streaming | Listening | Watching | Competing | Custom
        ACTIVITY_NAME: "Creating Bots",
        ACTIVITY_URL: "https://www.twitch.tv/neasthetic", // Obrigatorio para Streaming
        STATUS: "online", // online | idle | dnd | invisible
    },

    COMMANDS: {
        TYPE: 'GUILD', // GLOBAL: todos os servidores | GUILD: apenas SERVER_GUILDS
        PREFIX_COMMANDS_ENABLED: false,
        PREFIX: '!',
        SERVER_GUILDS: ["1476329401279971378"],
    },

    ANTI_CRASH: {
        ERROR_WEBHOOK: process.env.ERROR_WEBHOOK_URL,
        RATE_LIMIT_MS: 5000
    },
};
 