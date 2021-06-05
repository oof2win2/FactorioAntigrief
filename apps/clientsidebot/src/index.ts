/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */

import * as util from "util"
import * as fs from "fs"
const readdir = util.promisify(fs.readdir)

process.chdir(__dirname)

import "./utils/extenders"
// This enables FAGCBot to access the extenders in any part of the codebase

import FAGCBot from "./base/fagcbot"
export const client = new FAGCBot({})

const init = async () => {
	// Loads commands
	const dirs = await readdir("./commands/")
	// Reads the commands directory
	dirs.forEach(async (dir) => {
		const cmds = await readdir(`./commands/${dir}/`)
		// gets every dir inside commands
		cmds.filter(cmd => cmd.split(".").pop() === "ts").forEach(async (cmd) => {
			const res = await client.loadCommand(`./commands/${dir}`, cmd)
			// loads each command
			if (res) client.logger(res)
			// if there's an error, log it
			// else client.logger(`Command ${cmd} loaded`, "debug")
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
			const event = (require(`./events/${dir}/${evt}`)).default
			// import event from `./events/${dir}/${evt}`
			// import * as event from `./events/${dir}/${evt}`
			// binds client to the event
			client.on(evtName, (...args) => event(client, ...args))
			delete require.cache[require.resolve(`./events/${dir}/${evt}`)]
		})
	})
	
	// log in to discord
	client.login(client.config.token)

	const rcon = require("./base/rcon")
	rcon.client = client
}
init()