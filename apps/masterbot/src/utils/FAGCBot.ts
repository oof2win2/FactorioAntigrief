import { Client, ClientOptions, Collection } from "discord.js"
import Command from "./Command.js"
import fs from "fs"
import { FAGCWrapper } from "fagc-api-wrapper"

interface FAGCBotOptions extends ClientOptions {
	fagc: {
		apiurl: string,
		masterapikey: string
	}
}

export default class FAGCBot extends Client {
	public commands: Collection<string, Command>
	public FAGC: FAGCWrapper

	constructor(options: FAGCBotOptions) {
		super(options)

		this.commands = new Collection()

		this.FAGC = new FAGCWrapper({
			apiurl: options.fagc.apiurl,
			socketurl: "",
			enableWebSocket: false,
			masterapikey: options.fagc.masterapikey
		})

		// event handler
		fs.readdirSync("./events").forEach(async (event) => {
			const handler = await import(`../events/${event}`).then(r=>r.default)
			this.on(event.slice(0, event.indexOf(".js")), (interaction) => handler(this, interaction))
		})

		// register command handlers
		fs.readdirSync("./commands").forEach(async commandFile => {
			const command = await import(`../commands/${commandFile}`)
			const commandName = commandFile.slice(0, commandFile.indexOf(".js"))
			this.commands.set(commandName, command.default)
		})
	}
}