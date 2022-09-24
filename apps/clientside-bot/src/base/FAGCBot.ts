import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig, Community, FilterObject } from "fagc-api-types"
import ENV from "../utils/env.js"
import { Client, ClientOptions, Collection, MessageEmbed } from "discord.js"
import { Command as CommandType } from "./Commands.js"
import * as database from "./database.js"
import wshandler from "./wshandler.js"
import RCONInterface from "./rcon.js"
import fs from "fs"
import { z } from "zod"
import { Connection } from "typeorm"
import BotConfig from "../database/BotConfig.js"
import InfoChannel from "../database/InfoChannel.js"
import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBan from "../database/FAGCBan.js"
import ServerSyncedActionHandler from "./ServerReadHandler.js"
import { BaseAction, ServerSyncedBan, ServerSyncedUnban } from "../types.js"
import PrivateBan from "../database/PrivateBan.js"
import LinkedAdmin from "../database/LinkedAdmin.js"

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
	// private _botConfig so that it can be accessed any time from external code with the botConfig getter
	private _botConfig: database.BotConfigType | null = null
	/**
	 * Info channels
	 */
	infochannels: InfoChannel[] = []
	/**
	 * Guild configs, by guild ID
	 */
	guildConfig: GuildConfig | null = null
	community: Community | null = null
	embedQueue: Collection<string, MessageEmbed[]>
	servers: database.FactorioServerType[] = []
	private _filterObject: FilterObject | null = null
	readonly rcon: RCONInterface
	private recentServerSyncedBans: Map<string, Date> = new Map()
	private recentServerSyncedUnbans: Map<string, Date> = new Map()
	serverSyncedActionHandler: ServerSyncedActionHandler

	constructor(options: BotOptions) {
		super(options)
		this.db = options.database
		this.fagc = new FAGCWrapper({
			apiurl: ENV.APIURL,
			socketurl: ENV.WSURL,
			enableWebSocket: true,
			apikey: ENV.APIKEY,
		})
		this.commands = new Collection()

		this.embedQueue = new Collection()

		this.servers = getServers()

		this.rcon = new RCONInterface(this, this.servers)

		// load info channels
		this.db
			.getRepository(InfoChannel)
			.find()
			.then((channels) => (this.infochannels = channels))
		// load bot config or create one if it doesnt exist yet
		this.db
			.getRepository(BotConfig)
			.findOne()
			.then((x) => {
				if (x) return (this._botConfig = x)
				this.setBotConfig({
					guildId: ENV.GUILDID,
				})
			})

		// load fagc guild config
		this.fagc.communities
			.fetchGuildConfig({ guildId: ENV.GUILDID })
			.then((config) => (this.guildConfig = config))

		// register listeners for parsing WS notifications
		Object.entries(wshandler).forEach(([eventname, handler]) => {
			if (!handler) return
			this.fagc.websocket.on(
				eventname as keyof WebSocketEvents,
				async (event: any) => {
					await handler({ event, client: this })
					this.setBotConfig({
						lastNotificationProcessed: new Date(),
					})
				}
			)
		})

		this.serverSyncedActionHandler = new ServerSyncedActionHandler(
			this.servers
		)

		this.serverSyncedActionHandler.on("ban", (evt) =>
			this.handleSyncedBan(evt)
		)
		this.serverSyncedActionHandler.on("unban", (evt) =>
			this.handleSyncedUnban(evt)
		)

		setInterval(() => this.sendEmbeds(), 10 * 1000) // send embeds every 10 seconds
		setInterval(() => this.clearRecentServerSyncedActions(), 60 * 1000) // clear recent server synced actions every minute
	}

	async sendToErrorChannel(text: string) {
		const channel = this.channels.cache.get(ENV.ERRORCHANNELID)
		if (!channel || !channel.isNotDMChannel()) return
		channel.send(text)
	}

	get botConfig(): database.BotConfigType {
		if (this._botConfig) return this._botConfig
		return {
			guildId: ENV.GUILDID,
			owner: ENV.OWNERID,
			lastNotificationProcessed: new Date(0),
			reportAction: "ban",
			revocationAction: "unban",
		}
	}

	async setBotConfig(config: Partial<database.BotConfigType>) {
		await this.db
			.getRepository(BotConfig)
			.upsert({ ...config, guildId: config.guildId ?? ENV.GUILDID }, [
				"guildId",
			])
		const record = await this.db.getRepository(BotConfig).findOneOrFail()
		this._botConfig = record
	}

	private sendEmbeds() {
		for (const [channelId] of this.embedQueue) {
			const embeds = this.embedQueue.get(channelId)?.splice(0, 10) ?? []
			if (!embeds.length) continue
			const channel = this.channels.resolve(channelId)
			if (!channel || !channel.isNotDMChannel()) continue
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

	createBanCommand(report: Omit<FAGCBan, "createdAt" | "removedAt">) {
		const botConfig = this.botConfig

		const rawBanMessage =
			botConfig.reportAction === "ban"
				? ENV.BANCOMMAND
				: ENV.CUSTOMBANCOMMAND
		const command = rawBanMessage
			.replaceAll("{COMMUNITYID}", report.communityId)
			.replaceAll("{REPORTID}", report.id)
			.replaceAll("{PLAYERNAME}", report.playername)
		return command
	}

	createUnbanCommand(playername: string) {
		const botConfig = this.botConfig
		if (!botConfig || botConfig.revocationAction === "none") return false

		const rawUnbanMessage =
			botConfig.reportAction === "ban"
				? ENV.UNBANCOMMAND
				: ENV.CUSTOMUNBANCOMMAND
		const command = rawUnbanMessage.replaceAll("{PLAYERNAME}", playername)
		return command
	}

	/**
	 * Remove cached records of recent actions from servers
	 * @param clearAll If true, records of all actions will be removed. If false, only records older than 5 minutes will be removed.
	 */
	clearRecentServerSyncedActions(clearAll = false) {
		if (clearAll) {
			this.recentServerSyncedBans.clear()
			this.recentServerSyncedUnbans.clear()
			return
		}

		const now = new Date()
		const cutoff = new Date(now.valueOf() - 60 * 1000)
		for (const [playername, createdAt] of this.recentServerSyncedBans) {
			if (createdAt < cutoff) {
				this.recentServerSyncedBans.delete(playername)
			}
		}

		for (const [playername, createdAt] of this.recentServerSyncedUnbans) {
			if (createdAt < cutoff) {
				this.recentServerSyncedUnbans.delete(playername)
			}
		}
	}

	async handleSyncedBan(ban: BaseAction<ServerSyncedBan>) {
		// if we performed an action like this already recently, we dont want to do it again
		if (this.recentServerSyncedBans.has(ban.action.playername)) return

		const banCommand = `/c game.ban_player("${ban.action.playername}", "${ban.action.reason}")`
		this.rcon.rconCommandAll(banCommand)

		this.recentServerSyncedBans.set(ban.action.playername, new Date())

		if (ban.action.byPlayer) {
			const admin = await this.db.getRepository(LinkedAdmin).findOne({
				where: { playername: ban.action.byPlayer },
			})

			if (!admin)
				this.sendToErrorChannel(
					`Admin with playername ${ban.action.byPlayer} not found in database`
				)

			this.db.getRepository(PrivateBan).insert({
				playername: ban.action.playername,
				reason: ban.action.reason,
				adminId: admin ? admin.discordId : ENV.OWNERID,
			})
		}
	}

	async handleSyncedUnban(unban: BaseAction<ServerSyncedUnban>) {
		// if we performed an action like this already recently, we dont want to do it again
		if (this.recentServerSyncedUnbans.has(unban.action.playername)) return

		this.recentServerSyncedUnbans.set(unban.action.playername, new Date())

		const unbanCommand = `/c game.unban_player("${unban.action.playername}")`
		this.rcon.rconCommandAll(unbanCommand)

		this.db.getRepository(PrivateBan).delete({
			playername: unban.action.playername,
		})
	}

	createActionForReport(playername: string) {
		this.recentServerSyncedBans.set(playername, new Date())
	}

	createActionForUnban(playername: string) {
		this.recentServerSyncedUnbans.set(playername, new Date())
	}

	get filterObject(): FilterObject {
		if (this._filterObject) return this._filterObject

		const filterObject: FilterObject = {
			id: "00000",
			communityFilters: [],
			categoryFilters: [],
		}
		return filterObject
	}
	set filterObject(filterObject: FilterObject) {
		this._filterObject = filterObject
	}
}
