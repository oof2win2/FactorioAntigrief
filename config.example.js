module.exports = {
    token: "", // Discord bot token
    mongoURI: "", // Database connection string
    dbOptions: { // mongoose database initialization options
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    },
    prefix: "fagc!", // bot prefix
    apiurl: "http://localhost:3000/v1", // URL address of the API
    adminIDs: [ // Discord UserIDs of users who have complete access over the bot (can restart it etc.)
        "429696038266208258"
    ],
    embeds: { // Embed configuration
        color: "GREEN",
        footer: "FAGC Team | oof2win2"
    },
    emotes: { // A list of emotes
        error: ":x:",
        success: "<:success:841385407790317588>"
    },
    fagcInvite: "FAGC INVITE STRING", // Invite to the FAGC discord server
    sentryLink: "" // Your Sentry.io link for logging errors
}