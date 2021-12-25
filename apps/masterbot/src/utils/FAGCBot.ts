import { Client, ClientOptions, Collection, Constants } from "discord.js"
import {Command} from "./Command.js"
import fs from "fs"
import { FAGCWrapper } from "fagc-api-wrapper"
import {PrismaClient} from ".prisma/client/index.js"
import ENV from "./env.js"

interface FAGCBotOptions extends ClientOptions {
	fagc: {
		apiurl: string,
		masterapikey: string
	}
}

export default class FAGCBot extends Client {
	public commands: Collection<string, Command>
	public FAGC: FAGCWrapper
	public db: PrismaClient

	constructor(options: FAGCBotOptions) {
		super(options)

		this.commands = new Collection()

		this.FAGC = new FAGCWrapper({
			apiurl: options.fagc.apiurl,
			socketurl: "",
			enableWebSocket: false,
			masterapikey: options.fagc.masterapikey
		})

		this.db = new PrismaClient()
		this.db.$connect()

		// event handler
		fs.readdirSync("./events").forEach(async (event) => {
			const handler = await import(`../events/${event}`).then(r => r.default)
			this.on(event.slice(0, event.indexOf(".js")), (interaction) => handler(this, interaction))
		})

		// register command handlers
		fs.readdirSync("./commands")
			.filter(command => command.endsWith(".js"))
			.forEach(async commandFile => {
				const command = await import(`../commands/${commandFile}`)
				const commandName = commandFile.slice(0, commandFile.indexOf(".js"))
				this.commands.set(commandName, command.default)
			})
		
		// refresh command perms after 5s
		setTimeout(() => this.refreshCommandPerms(), 5000)
	}

	async refreshCommandPerms() {
		// TODO: save rules to db when pushing to discord
		const commands = await this.db.command.findMany()
		const roleID = ENV.ACCESSROLEID
		this.guilds.cache.get(ENV.TESTGUILDID)?.commands.permissions.set({
			fullPermissions: commands.map((command) => {
				return {
					id: command.id,
					permissions: [
						{
							id: roleID,
							type: Constants.ApplicationCommandPermissionTypes.ROLE,
							permission: true
						}
					]
				}
			})
		})
	}
}