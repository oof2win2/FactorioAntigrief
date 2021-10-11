import dotenv from "dotenv"
import { cleanEnv, str, port, host } from "envalid"
dotenv.config({
	path: "./.env",
})
const ENV = cleanEnv(process.env, {
	MONGOURI: str({
		example:
			"mongodb+srv://dbUse:dbPassword@databaseLocation/defaultDatabaseName",
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
	APPREDIRECTURI: str({ desc: "Your Discord redirect URI" }),
	SESSIONSECRET: str({ desc: "Cookie session secret" }),
	COOKIENAME: str({ desc: "Cookie name", default: "sid" }),
})
export default ENV
