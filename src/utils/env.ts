import dotenv from "dotenv"
import { cleanEnv, str, port, host, url, num } from "envalid"
dotenv.config({
	path: "./.env",
})
// env validation
const ENV = cleanEnv(
	process.env,
	{
		NODE_ENV: str({ default: "production", choices: [ "development", "production" ] }),
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
		API_HOST: host({ default: "0.0.0.0" }),
		DISCORD_BOTTOKEN: str({ desc: "Your Discord bot token" }),
		SENTRY_LINK: str({ default: "", desc: "Your sentry.io link" }),
		PROMETHEUS_PORT: port({
			default: 9110,
			desc: "Port where Prometheus should run for statistics etc.",
		}),
		JWT_SECRET: str({ desc: "Secret for signing JWTs" }),
	},
	{}
)
export default ENV
