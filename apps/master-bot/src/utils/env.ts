import dotenv from "dotenv"
import { cleanEnv, str, port, url } from "envalid"
dotenv.config({
	path: "./.env"
})
const ENV = cleanEnv(process.env, {
	API_URL: url({ desc: "API URL" }),
	MASTERAPIKEY: str({ desc: "FAGC Master API key" }),
	DISCORD_BOTTOKEN: str({ desc: "Your Discord bot token" }),
	CLIENTID: str({ desc: "Your Discord bot's Client ID" }),
	TESTGUILDID: str({ desc: "Your test guild ID" }),
	ACCESSROLEID: str({ desc: "Role ID that can access the bot" })
})
export default ENV