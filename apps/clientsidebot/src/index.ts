/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */

import * as util from "util"
import * as fs from "fs"
const readdir = util.promisify(fs.readdir)

process.chdir("dist")

import "./utils/extenders.js"
// This enables FAGCBot to access the extenders in any part of the codebase

import FAGCBot from "./base/fagcbot.js"
export const client = new FAGCBot({
	intents: ["GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_WEBHOOKS", "GUILDS"]
})

import rcon from "./base/rcon.js"

const init = async () => {
	// Loads commands

	// Loads events
	const evts = await readdir("./events/")
	// reads the events dir
	evts.forEach(async (evt) => {
		// splits the event and gets first part. events are in the format "eventName.js"
		const evtName = evt.split(".")[0]
		// const event = (require(`./events/${dir}/${evt}`)).default
		const event = await import(`./events/${evt}`).then(e=>e.default)
		// import event from `./events/${dir}/${evt}`
		// import * as event from `./events/${dir}/${evt}`
		// binds client to the event
		client.on(evtName, (...args) => event(client, ...args))
	})
	
	// log in to discord
	client.login(client.config.token)

	rcon.client = client
}
init()