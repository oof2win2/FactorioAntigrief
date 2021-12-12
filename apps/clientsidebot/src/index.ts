import { Intents } from "discord.js"
import { readdir } from "fs/promises"
import FAGCBot from "./base/FAGCBot.js"
import ENV from "./utils/env.js"
import "./extenders.js"

process.chdir("dist")

const client = new FAGCBot({
	intents: [ Intents.FLAGS.GUILDS ],
})


const events = await readdir("events")
events.forEach(async (name) => {
	if (!name.endsWith(".js")) return
	const handler = await import(`./events/${name}`).then(r=>r.default)
	client.on(name.slice(0, name.indexOf(".js")), (...args) => handler(client, args))
})

const commands = await readdir("commands")
commands.forEach(async (name) => {
	if (!name.endsWith(".js")) return
	const handler = await import(`./commands/${name}`).then(r=>r.default)
	client.commands.set(name.slice(0, name.indexOf(".js")), handler)
})

client.login(ENV.DISCORD_BOTTOKEN)

// check for existing bans on servers after the bot is started
setTimeout(() => client.checkBans(), 10*1000)