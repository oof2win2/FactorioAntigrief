import dotenv from "dotenv"
import { cleanEnv, str, port } from "envalid"
dotenv.config({
	path: "./.env",
})
// env validation
const ENV = cleanEnv(process.env, {
	MONGOURI: str({
		example:
			"mongodb+srv://dbUse:dbPassword@databaseLocation/defaultDatabaseName",
	}),
	API_PORT: port({ default: 3000 }),
	WS_PORT: port({ default: 8000, desc: "WebSocket port" }),
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
