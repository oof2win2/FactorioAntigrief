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
	]
}