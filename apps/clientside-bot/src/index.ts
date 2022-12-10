import "reflect-metadata"
import { Intents } from "discord.js"
import FDGLBot from "./base/FDGLBot.js"
import ENV from "./utils/env.js"
import "./extenders.js"
import { readdirSync } from "fs"
import { createConnection } from "typeorm"
import dbConnectionOptions from "./base/dbConnectionOptions.js"

process.chdir("dist")

async function run() {
	const database = await createConnection(await dbConnectionOptions())
	const client = new FDGLBot({
		intents: [Intents.FLAGS.GUILDS],
		database,
	})

	// first we need to setup, only after we want to start handling commands and events
	await client.setupPreLogin()

	const events = readdirSync("events")
	events.forEach(async (name) => {
		if (!name.endsWith(".js")) return
		const handler = await import(`./events/${name}`).then((r) => r.default)
		client.on(name.slice(0, name.indexOf(".js")), (...args) =>
			handler(client, args)
		)
	})

	const commands = readdirSync("commands")
	commands.forEach(async (name) => {
		if (!name.endsWith(".js")) return
		const handler = await import(`./commands/${name}`).then(
			(r) => r.default
		)
		client.commands.set(name.slice(0, name.indexOf(".js")), handler)
	})

	client.login(ENV.DISCORD_BOTTOKEN)

	process.on("exit", () => {
		client.destroy()
		client.fdgl.destroy()
	})
}
run()
