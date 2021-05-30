/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */
const mongoose = require("mongoose")
const util = require("util")
const fs = require("fs")
const readdir = util.promisify(fs.readdir)
const config = require("../config")

process.chdir(__dirname)

// Sentry.io logging
const Sentry = require("@sentry/node")
// eslint-disable-next-line no-unused-vars
const Tracing = require("@sentry/tracing")
const { CaptureConsole } = require("@sentry/integrations")
Sentry.init({
	dsn: config.sentryLink,
	integrations: [
		new CaptureConsole({ // capture stuff on console.error
			levels: ["error"]
		})
	],

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
})

require("./utils/extenders")
// This enables FAGCBot to access the extenders in any part of the codebase

mongoose.connect(config.mongoURI, config.dbOptions).then(() => {
	client.logger.log("Database connected", "log")
}).catch(err => client.logger.log("Error connecting to database. Error:" + err, "error"))

const FAGCBot = require("./base/fagcbot")
const client = new FAGCBot()


const init = async () => {
	// Loads commands
	const dirs = await readdir("./commands/")
	// Reads the commands directory
	dirs.forEach(async (dir) => {
		const cmds = await readdir(`./commands/${dir}/`)
		// gets every dir inside commands
		cmds.filter(cmd => cmd.split(".").pop() === "js").forEach(cmd => {
			const res = client.loadCommand(`./commands/${dir}`, cmd)
			// loads each command
			if (res) client.logger.log(res, "error")
			// if there's an error, log it
			// else client.logger.log(`Command ${cmd} loaded`, "debug")
		})
	})

	// Loads events
	const evtDirs = await readdir("./events/")
	// reads the events dir
	evtDirs.forEach(async dir => {
		const evts = await readdir(`./events/${dir}/`)
		// gets every dir inside events
		evts.forEach(evt => {
			// splits the event and gets first part. events are in the format "eventName.js"
			const evtName = evt.split(".")[0]
			const event = require(`./events/${dir}/${evt}`)
			// binds client to the event
			client.on(evtName, (...args) => event(client, ...args))
			delete require.cache[require.resolve(`./events/${dir}/${evt}`)]
		})
	})

	// log in to discord
	client.login(client.config.token)
}
init()