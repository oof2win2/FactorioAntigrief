import fs from "fs/promises"
import ENV from "./utils/env"
import * as Sentry from "@sentry/node"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Tracing from "@sentry/tracing"
import { CaptureConsole } from "@sentry/integrations"
import FAGCBot from "./base/fagcbot"
import { Intents } from "discord.js"
import { Command } from "./base/Command"

process.chdir(__dirname)
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

const client = new FAGCBot({
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
	const commandDirs = await fs.readdir("./commands/")
	// reads the commands dir
	commandDirs.forEach(async (dir) => {
		const evts = await fs.readdir(`./commands/${dir}/`)
		// gets every dir inside events
		evts.filter((evt) => evt.endsWith(".js")).forEach(async (cmd) => {
			// splits the command and gets first part. commands are in the format "commandName.js"
			const command = (await import(`./commands/${dir}/${cmd}`).then(
				(x) => x.default
			)) as Command

			if (!command)
				return console.log(`./commands/${dir}/${cmd} is not a command`)

			// adds command to client
			client.commands.set(command.name, command)
			// adds aliases to the command
			command.aliases.forEach((alias) =>
				client.commands.set(alias, command)
			)
		})
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
