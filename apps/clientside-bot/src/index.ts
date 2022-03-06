import "reflect-metadata"
import { Intents } from "discord.js"
import FAGCBot from "./base/FAGCBot.js"
import ENV from "./utils/env.js"
import "./extenders.js"
import { readdirSync } from "fs"

process.chdir("dist")

const client = new FAGCBot({
	intents: [Intents.FLAGS.GUILDS],
})

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
	const handler = await import(`./commands/${name}`).then((r) => r.default)
	client.commands.set(name.slice(0, name.indexOf(".js")), handler)
})

// log the client in only when the database is ready
client.on("dbReady", () => {
	client.login(ENV.DISCORD_BOTTOKEN)
})

process.on("exit", () => {
	client.destroy()
	client.fagc.destroy()
})
