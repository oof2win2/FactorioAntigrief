import dotenv from "dotenv"
import { cleanEnv, str, url } from "envalid"
dotenv.config({
	path: "./.env",
})
// env validation
const ENV = cleanEnv(
	process.env,
	{
		APIURL: url({ desc: "FAGC API URL", default: "https://factoriobans.club/api" }),
		WSURL: url({ desc: "FAGC WS URL", default: "wss://factoriobans.club/api/ws" }),
		DATABASE_URL: str({ desc: "DB URL" }),
		DISCORD_BOTTOKEN: str({ desc: "Discord bot token" }),
		TESTGUILDID: str({ desc: "Testing guild ID, where to deploy commands when NODE_ENV is development" }),
		GUILDID: str({ desc: "Guild ID, where to deploy commands when NODE_ENV is production" }),
	},
	{}
)
export default ENV