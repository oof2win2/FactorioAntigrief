import dotenv from "dotenv"
import { cleanEnv, str, url } from "envalid"
dotenv.config({
	path: "./.env",
})
const ENV = cleanEnv(process.env, {
	MONGOURI: url({
		example:
			"mongodb+srv://dbUse:dbPassword@databaseLocation/defaultDatabaseName",
	}),
	APIURL: url({ desc: "API URL" }),
	MASTERAPIKEY: str({ desc: "FAGC Master API key" }),
	DISCORD_BOTTOKEN: str({ desc: "Your Discord bot token" }),
	SENTRY_LINK: url({ desc: "Your sentry.io link" }),
	FAGC_INVITE_STRING: str({ desc: "FAGC server invite string" }),
	BOTPREFIX: str({ desc: "Discord bot prefix" }),
})

export default ENV