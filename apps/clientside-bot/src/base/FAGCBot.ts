import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig, Community, FilterObject } from "fagc-api-types"
import ENV from "../utils/env.js"
import { Client, ClientOptions, Collection, MessageEmbed } from "discord.js"
import { Command as CommandType } from "./Commands.js"
import * as database from "./database.js"
import wshandler from "./wshandler.js"
import { Report, Revocation } from "fagc-api-types"
import RCONInterface from "./rcon.js"
import fs from "fs"
import { z } from "zod"
import { createConnection, Connection } from "typeorm"
import BotConfig from "../database/BotConfig.js"
import InfoChannel from "../database/InfoChannel.js"

function getServers(): database.FactorioServerType[] {
	const serverJSON = fs.readFileSync(ENV.SERVERSFILEPATH, "utf8")
	const servers = z
		.array(database.FactorioServer)
		.parse(JSON.parse(serverJSON))
	return servers
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BotOptions extends ClientOptions {
	database: Connection
}
export default class FAGCBot extends Client {
	fagc: FAGCWrapper
	db: Connection
	commands: Collection<string, CommandType>
	/**
	 * Info channels, grouped by guild ID
	 */
	infochannels: Collection<string, InfoChannel[]>
	/**
	 * Guild configs, by guild ID
	 */
	guildConfigs: Collection<string, GuildConfig>
	community?: Community
	botConfigs: Collection<string, database.BotConfigType>
	embedQueue: Collection<string, MessageEmbed[]>
	servers: Collection<string, database.FactorioServerType[]>
	readonly rcon: RCONInterface

	constructor(options: BotOptions) {
		super(options)
		this.db = options.database
		this.guildConfigs = new Collection()
		this.fagc = new FAGCWrapper({
			apiurl: ENV.APIURL,
			socketurl: ENV.WSURL,
			enableWebSocket: true,
		})
		this.commands = new Collection()

		this.infochannels = new Collection()
		this.embedQueue = new Collection()
		this.servers = new Collection()

		this.botConfigs = new Collection()

		const rawServers = getServers()

		rawServers.map((server) => {
			const existing = this.servers.get(server.discordGuildId)
			if (existing) {
				this.servers.set(server.discordGuildId, [...existing, server])
			} else {
				this.servers.set(server.discordGuildId, [server])
			}
		})

		this.rcon = new RCONInterface(this, rawServers)

		const loadInfoChannels = async () => {
			const channels = await this.db.getRepository(InfoChannel).find()
			channels.forEach((channel) => {
				const existing = this.infochannels.get(channel.guildId)
				if (existing) {
					this.infochannels.set(channel.guildId, [
						...existing,
						channel,
					])
				} else {
					this.infochannels.set(channel.guildId, [channel])
				}
			})
		}
		loadInfoChannels()

		this.getBotConfigs().then((configs) => {
			configs.forEach((config) => {
				this.botConfigs.set(config.guildId, config)
			})
		})

		// parsing WS notifications
		Object.keys((eventname: keyof typeof wshandler) => {
			const handler = wshandler[eventname]
			if (!handler) return
			this.fagc.websocket.on(eventname, async (event: any) => {
				await handler({ event, client: this })
				for (const [_, botConfig] of this.botConfigs) {
					this.setBotConfig({
						guildId: botConfig.guildId,
						lastNotificationProcessed: new Date(),
					})
				}
			})
		})

		setInterval(() => this.sendEmbeds(), 10 * 1000) // send embeds every 10 seconds
	}

	async getAllFilters(): Promise<FilterObject[]> {
		const guilds = this.guildConfigs.map(async (config) => {
			return (await this.fagc.communities.getFiltersById({
				id: config.filterObjectId,
			}))!
		})
		return await Promise.all(guilds)
	}

	async getBotConfigs(): Promise<BotConfig[]> {
		const records = await this.db.getRepository(BotConfig).find()
		return records
	}

	async getBotConfig(guildId: string): Promise<database.BotConfigType> {
		const existing = this.botConfigs.get(guildId)
		if (existing) return existing
		console.log("y")
		const record = await this.db.getRepository(BotConfig).findOne({
			where: {
				guildId: guildId,
			},
		})
		console.log("y")
		const created = database.BotConfig.parse(record ?? { guildId: guildId })
		console.log("y")
		if (!record) await this.setBotConfig(created)
		return created
	}

	async setBotConfig(
		config: Partial<database.BotConfigType> &
			Pick<database.BotConfigType, "guildId">
	) {
		if (this.botConfigs.get(config.guildId)) {
			// has an existing config
			await this.db
				.getRepository(BotConfig)
				.upsert({ ...config, guildId: config.guildId }, ["guildId"])
		} else {
			const toSave = database.BotConfig.parse(config)
			await this.db
				.getRepository(BotConfig)
				.save({ ...toSave, guildId: config.guildId })
		}
		// should exist as the config already exists
		const newConfig = await this.db
			.getRepository(BotConfig)
			.findOneOrFail(config.guildId)
		this.botConfigs.set(config.guildId, newConfig)
	}

	private sendEmbeds() {
		for (const [channelId] of this.embedQueue) {
			const embeds = this.embedQueue.get(channelId)?.splice(0, 10) ?? []
			if (!embeds.length) continue
			const channel = this.channels.resolve(channelId)
			if (!channel || !channel.isNotDMChannel()) continue
			const infoChannels = this.infochannels.get(channel.guild.id)
			if (!infoChannels) continue
			channel.send({ embeds: embeds })
		}
	}

	addEmbedToQueue(channelId: string, embed: MessageEmbed) {
		const channel = this.channels.resolve(channelId)
		if (!channel || !channel.isNotDMChannel()) return false
		if (this.embedQueue.has(channelId)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			this.embedQueue.set(channelId, [
				...this.embedQueue.get(channelId)!,
				embed,
			])
		} else {
			this.embedQueue.set(channelId, [embed])
		}
	}

	async getGuildConfig(guildId: string): Promise<GuildConfig | null> {
		const existing = this.guildConfigs.get(guildId)
		if (existing) return existing
		const config = await this.fagc.communities.fetchGuildConfig({
			guildId: guildId,
		})
		if (!config) return null
		this.guildConfigs.set(guildId, config)
		return config
	}

	createBanCommand(report: Report, guildId: string) {
		const botConfig = this.botConfigs.get(guildId)
		if (!botConfig || botConfig.reportAction === "none") return false

		const rawBanMessage =
			botConfig.reportAction === "ban"
				? ENV.BANCOMMAND
				: ENV.CUSTOMBANCOMMAND
		const command = rawBanMessage
			.replaceAll("{ADMINID}", report.adminId)
			.replaceAll("{AUTOMATED}", report.automated ? "true" : "false")
			.replaceAll("{CATEGORYID}", report.categoryId)
			.replaceAll("{COMMUNITYID}", report.communityId)
			.replaceAll("{REPORTID}", report.id)
			.replaceAll("{DESCRIPTION}", report.description)
			.replaceAll("{PLAYERNAME}", report.playername)
			.replaceAll("{PROOF}", report.proof)
			.replaceAll("{REPORTEDTIME}", report.reportedTime.toISOString())
		return command
	}

	createUnbanCommand(playername: string, guildId: string) {
		const botConfig = this.botConfigs.get(guildId)
		if (!botConfig || botConfig.revocationAction === "none") return false

		const rawUnbanMessage =
			botConfig.reportAction === "ban"
				? ENV.UNBANCOMMAND
				: ENV.CUSTOMUNBANCOMMAND
		const command = rawUnbanMessage.replaceAll("{PLAYERNAME}", playername)
		return command
	}

	async ban(report: Report, guildId: string) {
		const servers = this.servers.get(guildId)
		if (!servers || !servers.length) return
		const botConfig = await this.getBotConfig(guildId)
		if (!botConfig || botConfig.reportAction === "none") return

		const command = this.createBanCommand(report, guildId)
		if (!command) return

		this.rcon.rconCommandGuild(command, guildId)
	}

	async unban(revocation: Revocation, guildId: string) {
		const servers = this.servers.get(guildId)
		if (!servers || !servers.length) return
		const botConfig = await this.getBotConfig(guildId)
		if (!botConfig || botConfig.revocationAction === "none") return

		const rawUnbanMessage =
			botConfig.revocationAction === "unban"
				? ENV.UNBANCOMMAND
				: ENV.CUSTOMUNBANCOMMAND

		const command = rawUnbanMessage
			.replace("{ADMINID}", revocation.adminId)
			.replace("{AUTOMATED}", revocation.automated ? "true" : "false")
			.replace("{CATEGORYID}", revocation.categoryId)
			.replace("{COMMUNITYID}", revocation.communityId)
			.replace("{REPORTID}", revocation.id)
			.replace("{DESCRIPTION}", revocation.description)
			.replace("{PLAYERNAME}", revocation.playername)
			.replace("{PROOF}", revocation.proof)
			.replace("{REPORTEDTIME}", revocation.reportedTime.toTimeString())

		this.rcon.rconCommandGuild(command, guildId)
	}
}
