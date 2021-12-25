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
		OWNERID: str({ desc: "Bot owner ID" }),
		RCONPASSWORD: str({ desc: "RCON password for all servers", default: "" }),
		BANMESSAGE: str({ desc: "Command to ban with", default: "{PLAYERNAME} You have been banned for FAGC report {REPORTID} created on {DATE}" }),
		CUSTOMBAN: str({ desc: "Custom command to send over RCON", default: "game.ban_player({PLAYERNAME}, \"You have been banned for FAGC report {REPORTID} created on {DATE}\")" }),
		UNBANMESSAGE: str({ desc: "Command to unban with", default: "/unban {PLAYERNAME}" }),
		CUSTOMUNBAN: str({ desc: "Custom command to unban with", default: "/unban {PLAYERNAME}" }),
		ERRORCHANNELID: str({ desc: "Discord channel ID of error channel" }),
		SERVERSFILEPATH: str({ desc: "Path to JSON file of server descriptions", example: "/home/fagc/fagc-clientside-bot/servers.json" }),
	},
	{}
)
export default ENV