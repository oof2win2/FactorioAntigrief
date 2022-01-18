import fs from "fs/promises"
import ENV from "./utils/env"
import Sentry from "@sentry/node"
// eslint-disable-next-line no-unused-vars
import Tracing from "@sentry/tracing"
import { CaptureConsole } from "@sentry/integrations"
import FAGCBot from "./base/fagcbot"

process.chdir(__dirname)
Sentry.init({
	dsn: ENV.SENTRY_LINK,
	integrations: [
		new CaptureConsole({
			// capture stuff on console.error
			levels: [ "error" ],
		}),
	],

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
})

const client = new FAGCBot()

const init = async () => {
	// Loads commands
	const dirs = await fs.readdir("./commands/")
	// Reads the commands directory
	dirs.forEach(async (dir) => {
		const cmds = await fs.readdir(`./commands/${dir}/`)
		// gets every dir inside commands
		cmds.filter((cmd) => cmd.split(".").pop() === "js").forEach((cmd) => {
			const res = client.loadCommand(`./commands/${dir}`, cmd)
			// loads each command
			if (res) client.logger.log(res, "error")
			// if there's an error, log it
			// else client.logger.log(`Command ${cmd} loaded`, "debug")
		})
	})

	// Loads events
	const evtDirs = await fs.readdir("./events/")
	// reads the events dir
	evtDirs.forEach(async (dir) => {
		const evts = await fs.readdir(`./events/${dir}/`)
		// gets every dir inside events
		evts.forEach((evt) => {
			// splits the event and gets first part. events are in the format "eventName.js"
			const evtName = evt.split(".")[0]
			const event = require(`./events/${dir}/${evt}`)
			// binds client to the event
			client.on(evtName, (...args) => event(client, ...args))
			delete require.cache[require.resolve(`./events/${dir}/${evt}`)]
		})
	})

	// log in to discord
	client.login(ENV.DISCORD_BOTTOKEN)
}
init()
