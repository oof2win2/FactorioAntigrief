import dotenv from "dotenv"
import { cleanEnv, str, port, host, url, num } from "envalid"
dotenv.config({
	path: "./.env",
})
// env validation
const ENV = cleanEnv(
	process.env,
	{
		MONGOURI: url({
			example:
				"mongodb+srv://dbUse:dbPassword@databaseLocation/defaultDatabaseName",
			desc: "MongoDB Connection string",
		}),
		SESSION_DBPATH: str({
			desc: "Session DB path",
			default: "sessions.sqlite",
		}),
		API_PORT: port({ default: 3000 }),
		WS_PORT: port({ default: 8000, desc: "WebSocket port" }),
		API_HOST: host({ default: "0.0.0.0" }),
		WS_HOST: host({ default: "0.0.0.0" }),
		DISCORD_BOTTOKEN: str({ desc: "Your Discord bot token" }),
		SENTRY_LINK: str({ desc: "Your sentry.io link" }),
		PROMETHEUS_PORT: port({
			default: 9110,
			desc: "Port where Prometheus should run for statistics etc.",
		}),
		APPID: str({ desc: "Your Discord application ID" }),
		APPSECRET: str({ desc: "Your Discord application secret" }),
		APPREDIRECTURI: url({ desc: "Your Discord redirect URI" }),
		SESSIONSECRET: str({ desc: "Cookie session secret" }),
		SESSION_TTL: num({
			desc: "Fastify cookie session TTL. Default is 1 year",
			default: 31536000,
		}), // default to a year
		COOKIENAME: str({ desc: "Cookie name", default: "sid" }),
		BACKENDDBNAME: str({
			desc: "DB name for your backend",
			default: "fagc",
		}),
		BOTDBNAME: str({ desc: "DB name for your bot", default: "bot" }),
	},
	{}
)
export default ENV
