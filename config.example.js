module.exports = {
	token: "", // Discord bot token
	mongoURI: "", // MongoDB connection string
	dbOptions: { // DB options
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	},
	prefix: "fagc!", // Bot prefix
	apiurl: "http://localhost:3000/v1", // Base API url
	adminIDs: [ // Admins that can restart the bot etc
		"429696038266208258"
	],
	embeds: { // Embed configs
		color: "GREEN",
		footer: "FAGC Team | oof2win2"
	},
	emotes: { // Some emotes
		error: ":x:",
		success: "<:success:841385407790317588>"
	},
	fagcInvite: "FAGC INVITE STRING"
}