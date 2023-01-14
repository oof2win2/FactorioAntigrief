import { FDGLWrapper } from "@fdgl/wrapper"
import { GuildConfig, Community, FilterObject } from "@fdgl/types"
import ENV from "../utils/env.js"
import {
	ChannelType,
	Client,
	ClientOptions,
	Collection,
	EmbedBuilder,
} from "discord.js"
import { Command as CommandType } from "./Commands.js"
import * as database from "./database.js"
import wshandler from "./wshandler.js"
import RCONInterface from "./rcon.js"
import fs from "fs"
import { z } from "zod"
import { Connection } from "typeorm"
import BotConfig from "../database/BotConfig.js"
import InfoChannel from "../database/InfoChannel.js"
import { WebSocketEvents } from "@fdgl/wrapper/dist/WebsocketListener"
import FDGLBan from "../database/FDGLBan.js"
import ServerSyncedActionHandler from "./ServerReadHandler.js"
import {
	BaseAction,
	ServerSyncedBan,
	ServerSyncedUnban,
	FDGLCategoryAction,
	FDGLCategoryHandler,
} from "../types.js"
import PrivateBan from "../database/PrivateBan.js"
import LinkedAdmin from "../database/LinkedAdmin.js"
import CategoryActions from "../database/CategoryActions.js"

function getServers(): database.FactorioServerType[] {
	const serverJSON = fs.readFileSync(ENV.SERVERSFILEPATH, "utf8")
	const servers = z
		.array(database.FactorioServer)
		.parse(JSON.parse(serverJSON))
	return servers
}

interface BotOptions extends ClientOptions {
	database: Connection
}
export default class FDGLBot extends Client {
	fdgl: FDGLWrapper
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
	embedQueue: Collection<string, EmbedBuilder[]>
	servers: database.FactorioServerType[] = []
	private _filterObject: FilterObject | null = null
	readonly rcon: RCONInterface
	private recentServerSyncedBans: Map<string, Date> = new Map()
	private recentServerSyncedUnbans: Map<string, Date> = new Map()
	FDGLCategoryActions: Map<string, FDGLCategoryHandler> = new Map()
	serverSyncedActionHandler: ServerSyncedActionHandler

	constructor(options: BotOptions) {
		super(options)
		this.db = options.database
		this.fdgl = new FDGLWrapper({
			apiurl: ENV.APIURL,
			socketurl: ENV.WSURL,
			enableWebSocket: true,
			apikey: ENV.APIKEY,
		})
		this.commands = new Collection()

		this.embedQueue = new Collection()

		this.servers = getServers()

		this.rcon = new RCONInterface(this, this.servers)

		// register listeners for parsing WS notifications
		Object.entries(wshandler).forEach(([eventname, handler]) => {
			if (!handler) return
			this.fdgl.websocket.on(
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

	async setupPreLogin() {
		// we need to load info channels
		this.infochannels = await this.db.getRepository(InfoChannel).find()

		// load the whole bot's config
		const botconfig = await this.db.getRepository(BotConfig).findOne()
		if (botconfig) this._botConfig = botconfig

		// load the FDGL guild config, if exists
		const guildconfig = await this.fdgl.communities.fetchGuildConfig({
			guildId: ENV.GUILDID,
		})
		this.guildConfig = guildconfig

		// load all FDGL categories and their actions
		const categories = await this.fdgl.categories.fetchAll({})
		const actions = await this.db.getRepository(CategoryActions).find()
		// if there are categories that don't have actions, create them
		for (const category of categories) {
			if (!actions.find((a) => a.id === category.id)) {
				await this.db.getRepository(CategoryActions).save({
					id: category.id,
					options: 0,
				})
				actions.push({
					id: category.id,
					createOptions: 0,
					revokeOptions: 0,
					createCustomCommand: null,
					revokeCustomCommand: null,
					clearCustomCommand: null,
					factorioMessage: null,
				})
			}
		}
		// if there are actions that don't have categories, delete them
		for (const action of actions) {
			if (!categories.find((c) => c.id === action.id)) {
				await this.db.getRepository(CategoryActions).delete(action.id)
			}
		}
		// now we need to load the actions for each category in a a developer-friendly format
		for (const action of actions) {
			const createActions: FDGLCategoryAction[] = []
			const revokeActions: FDGLCategoryAction[] = []
			Object.values(FDGLCategoryAction)
				// we want to get the names of the actions, not the values
				.filter((v): v is number => !isNaN(Number(v)))
				.forEach((index) => {
					const bitMask = 1 << index
					// if this is true, then the bit at position index is set to 1
					// therefore the action is enabled
					if (action.createOptions & bitMask)
						createActions.push(index)
					if (action.revokeOptions & bitMask)
						revokeActions.push(index)
				})
			this.FDGLCategoryActions.set(action.id, {
				createAction: createActions,
				revokeAction: revokeActions,
				createCustomCommand: action.createCustomCommand,
				revokeCustomCommand: action.revokeCustomCommand,
				clearCustomCommand: action.clearCustomCommand,
				factorioMessage: action.factorioMessage,
			})
		}
	}

	async sendToErrorChannel(text: string) {
		const channel = this.channels.cache.get(ENV.ERRORCHANNELID)
		if (!channel || !channel.isTextBased()) return
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
			if (!channel || !channel.isTextBased()) continue
			channel.send({ embeds: embeds })
		}
	}

	addEmbedToQueue(channelId: string, embed: EmbedBuilder) {
		const channel = this.channels.resolve(channelId)
		if (!channel || !channel.isTextBased()) return false
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

	createBanCommand(report: Omit<FDGLBan, "createdAt" | "removedAt">) {
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

		if (this.rcon.offlineServerCount > 0) {
			await this.db.getRepository(PrivateBan).update(
				{
					playername: unban.action.playername,
				},
				{
					removedAt: new Date(),
				}
			)
		} else {
			await this.db.getRepository(PrivateBan).delete({
				playername: unban.action.playername,
			})
		}
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
