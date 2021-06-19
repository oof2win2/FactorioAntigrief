module.exports = {
    mongoURI: "", // MongoDB connection string
	dbConnections: [ // different mongoose connections. each one is extra mongoose config
		{
			dbName: "fagc",
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false
		},
		{
			dbName: "bot",
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false
		}
	],
	botToken: "", // Discord bot token
    sentryLink: "", // Sentry.io ingest link
    ports: { // some ports
        prometheus: 9110,
        api: 3000,
        websocket: 8000,
    }
}