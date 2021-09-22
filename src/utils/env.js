const dotenv = require("dotenv")
const { cleanEnv, str, url } = require("envalid")
dotenv.config({
	path: "./.env",
})
const ENV = cleanEnv(process.env, {
	MONGOURI: url({
		example:
			"mongodb+srv://dbUse:dbPassword@databaseLocation/defaultDatabaseName",
	}),
	APIURL: url({ desc: "API URL" }),
	DISCORD_BOTTOKEN: str({ desc: "Your Discord bot token" }),
	SENTRY_LINK: url({ desc: "Your sentry.io link" }),
	FAGC_INVITE_STRING: str({ desc: "FAGC server invite string" }),
	BOTPREFIX: str({ desc: "Discord bot prefix" }),
})

module.exports = ENV
