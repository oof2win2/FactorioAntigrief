import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig, Community } from "fagc-api-types"
import ENV from "../utils/env.js"
import { Client, ClientOptions } from "discord.js"
import { Command } from "./Commands.js"
import { PrismaClient } from ".prisma/client/index.js"
import * as database from "./database.js"


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BotOptions extends ClientOptions {

}
export default class FAGCBot extends Client {
	guildConfigs: Map<string, GuildConfig>
	community?: Community
	fagc: FAGCWrapper
	db: PrismaClient
	commands: Map<string, Command>

	constructor(options: BotOptions) {
		super(options)
		this.guildConfigs = new Map()
		this.fagc = new FAGCWrapper({
			apiurl: ENV.APIURL,
			socketurl: ENV.WSURL,
			enableWebSocket: true
		})
		this.commands = new Map()

		this.db = new PrismaClient()
		this.db.$connect()
	}
	async getConfig(): Promise<database.BotConfigType | null> {
		const record = await this.db.botConfig.findFirst()
		if (!record) return null
		return database.BotConfig.parse(record)
	}
	async setConfig(config: Partial<database.BotConfigType>) {
		this.db.botConfig.update({
			where: { id: 1 },
			data: config
		})
	}
	async syncCommands() {
		return
	}
}