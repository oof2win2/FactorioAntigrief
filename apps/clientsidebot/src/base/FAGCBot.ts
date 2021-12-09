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
	guildConfigs: GuildConfig[]
	community?: Community
	fagc: FAGCWrapper
	db: PrismaClient
	commands: Map<string, Command>

	constructor(options: BotOptions) {
		super(options)
		this.guildConfigs = []
		this.fagc = new FAGCWrapper({
			apiurl: ENV.APIURL,
			socketurl: ENV.WSURL,
			enableWebSocket: true
		})
		this.commands = new Map()

		this.db = new PrismaClient()
		this.db.$connect()
	}
	async getBotConfig(): Promise<database.BotConfigType> {
		const record = await this.db.botConfig.findFirst({
			include: {
				actions: true
			}
		})
		return database.BotConfig.parse(record ?? {})
	}
	async setBotConfig(config: Partial<database.BotConfigType>) {
		await this.db.botConfig.upsert({
			where: { id: 1 },
			create: {
				...database.BotConfig.parse(config),
				actions: undefined,
			},
			update: {
				...database.BotConfig.parse(config),
				actions: undefined,
			}
		})
		if (config.actions) await Promise.all(config.actions.map(action => this.setGuildAction(action)))
	}
	async setGuildAction(action: database.PickPartial<database.BotConfigType["actions"][0], "report"|"revocation">) {
		await this.db.actions.upsert({
			create: {
				...action,
				botConfigId: 1
			},
			update: {
				...action,
				guildID: undefined, // do not change guild id
			},
			where: {
				guildID: action.guildID
			}
		})
	}
	async getGuildActions() {
		const currentConfig = await this.getBotConfig()
		return currentConfig.actions
	}
	async getGuildAction(guildID: string): Promise<database.ActionType | null> {
		const action = await this.db.actions.findFirst({
			where: {
				guildID: guildID
			}
		})
		const parsed = database.Action.safeParse(action)
		return parsed.success ? parsed.data : null
	}
	
	async syncCommands() {
		return
	}
}