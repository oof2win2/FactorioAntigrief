import dotenv from "dotenv"
import { cleanEnv, str, url } from "envalid"
dotenv.config({
	path: `${__dirname}/../../.env`,
})
// env validation
const ENV = cleanEnv(
	process.env,
	{
		APIURL: url({
			desc: "FDGL API URL",
			default: "https://factoriobans.club/api",
		}),
		WSURL: url({
			desc: "FDGL WS URL",
			default: "wss://factoriobans.club/api/ws",
		}),
		DATABASE_URL: str({ desc: "DB URL", default: "../database.sqlite" }),
		DISCORD_BOTTOKEN: str({ desc: "Discord bot token" }),
		GUILDID: str({
			desc: "Guild ID, where to deploy commands when NODE_ENV is production",
		}),
		OWNERID: str({ desc: "Bot owner ID" }),
		RCONPASSWORD: str({
			desc: "RCON password for all servers",
			default: "",
		}),
		BANCOMMAND: str({
			desc: "Command to ban with",
			default:
				'game.ban_player("{PLAYERNAME}", "You have been banned for FDGL report {REPORTID} created on {REPORTEDTIME}")',
		}),
		CUSTOMBANCOMMAND: str({
			desc: "Custom command to send over RCON",
			default:
				'game.ban_player("{PLAYERNAME}", "You have been banned for FDGL report {REPORTID} created on {REPORTEDTIME}")',
		}),
		UNBANCOMMAND: str({
			desc: "Command to unban with",
			default: 'game.unban_player("{PLAYERNAME}")',
		}),
		CUSTOMUNBANCOMMAND: str({
			desc: "Custom command to unban with",
			default: 'game.unban_player("{PLAYERNAME}")',
		}),
		ERRORCHANNELID: str({ desc: "Discord channel ID of error channel" }),
		SERVERSFILEPATH: str({
			desc: "Path to JSON file of server descriptions",
			example: "/home/fdgl/fdgl-clientside-bot/servers.json",
			default: "../servers.json",
		}),
		SERVERFOLDERPATH: str({
			desc: "Path to folder with server folders",
			example: "/opt/factorio/servers",
			default: "",
		}),
		FILTEROBJECTID: str({ desc: "FDGL Filter object ID" }),
		APIKEY: str({ desc: "Your FDGL API key" }),
	},
	{}
)
export default ENV
