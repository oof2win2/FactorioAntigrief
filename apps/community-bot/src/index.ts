import fs from "fs/promises"
import ENV from "./utils/env"
import * as Sentry from "@sentry/node"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Tracing from "@sentry/tracing"
import { CaptureConsole } from "@sentry/integrations"
import FDGLBot from "./base/fdglbot"
import { Intents } from "discord.js"
import { readdirSync } from "fs"

process.chdir(__dirname)
if (ENV.SENTRY_LINK) {
	Sentry.init({
		dsn: ENV.SENTRY_LINK,
		integrations: [
			new CaptureConsole({
				// capture stuff on console.error
				levels: ["error"],
			}),
		],

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	})
}

const client = new FDGLBot({
	// maybe fix these intents later?
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_WEBHOOKS,
	],
})

const init = async () => {
	// Loads commands
	const commands = readdirSync("commands")
	commands.forEach(async (name) => {
		if (!name.endsWith(".js")) return
		const handler = await import(`./commands/${name}`).then(
			(r) => r.default
		)
		client.commands.set(name.slice(0, name.indexOf(".js")), handler)
	})

	// Loads events
	const evtDirs = await fs.readdir("./events/")
	// reads the events dir
	evtDirs.forEach(async (dir) => {
		const evts = await fs.readdir(`./events/${dir}/`)
		// gets every dir inside events
		evts.filter((evt) => evt.endsWith(".js")).forEach(async (evt) => {
			// splits the event and gets first part. events are in the format "eventName.js"
			const evtName = evt.split(".")[0]
			const event = await import(`./events/${dir}/${evt}`).then(
				(x) => x.default
			)
			// binds client to the event
			client.on(evtName, (...args) => event(client, ...args))
		})
	})

	// log in to discord
	client.login(ENV.DISCORD_BOTTOKEN)
}
init()
