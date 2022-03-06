import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig, Community } from "fagc-api-types"
import ENV from "../utils/env.js"
import { Client, ClientOptions, Collection, MessageEmbed } from "discord.js"
import { Command as CommandType } from "./Commands.js"
import * as database from "./database.js"
import * as wshandler from "./wshandler.js"
import { Report, Revocation } from "fagc-api-types"
import RCONInterface from "./rcon.js"
import fs from "fs"
import { z } from "zod"
import { Required } from "utility-types"
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums"
import { createConnection, Connection } from "typeorm"
import BotConfig from "../database/BotConfig.js"
import Command from "../database/Command.js"
import FAGCBan from "../database/FAGCBan.js"
import InfoChannel from "../database/InfoChannel.js"
import PrivateBan from "../database/PrivateBan.js"
import Whitelist from "../database/Whitelist.js"

function getServers(): database.FactorioServerType[] {
	const serverJSON = fs.readFileSync(ENV.SERVERSFILEPATH, "utf8")
	const servers = z
		.array(database.FactorioServer)
		.parse(JSON.parse(serverJSON))
	return servers
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BotOptions extends ClientOptions {}
export default class FAGCBot extends Client {
	fagc: FAGCWrapper
	db: Promise<Connection>
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

		this.db = createConnection({
			type: "better-sqlite3",
			database: ENV.DATABASE_URL,
			entities: [
				FAGCBan,
				InfoChannel,
				BotConfig,
				PrivateBan,
				Whitelist,
				Command,
			],
		})

		// load info channels
		this.db.then(async (connection) => {
			const channels = await connection.getRepository(InfoChannel).find()
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
		})

		this.getBotConfigs().then((configs) => {
			configs.forEach((config) => {
				this.botConfigs.set(config.guildId, config)
			})
		})

		// parsing WS notifications
		this.fagc.websocket.on("communityCreated", (event) =>
			wshandler.communityCreated({ event, client: this })
		)
		this.fagc.websocket.on("communityRemoved", (event) =>
			wshandler.communityRemoved({ event, client: this })
		)
		this.fagc.websocket.on("categoryCreated", (event) =>
			wshandler.categoryCreated({ event, client: this })
		)
		this.fagc.websocket.on("categoryRemoved", (event) =>
			wshandler.categoryRemoved({ event, client: this })
		)
		this.fagc.websocket.on("report", (event) =>
			wshandler.report({ event, client: this })
		)
		this.fagc.websocket.on("revocation", (event) =>
			wshandler.revocation({ event, client: this })
		)
		this.fagc.websocket.on("guildConfigChanged", (event) =>
			wshandler.guildConfigChanged({ event, client: this })
		)

		setInterval(() => this.sendEmbeds(), 10 * 1000) // send embeds every 10 seconds
	}

	async getBotConfigs(): Promise<BotConfig[]> {
		const records = await (await this.db).getRepository(BotConfig).find()
		return records
	}

	async getBotConfig(guildId: string): Promise<database.BotConfigType> {
		const existing = this.botConfigs.get(guildId)
		if (existing) return existing
		const record = await (await this.db).getRepository(BotConfig).findOne({
			where: {
				guildId: guildId,
			},
		})
		const created = database.BotConfig.parse(record ?? { guildId: guildId })
		if (!record) await this.setBotConfig(created)
		return created
	}

	async setBotConfig(
		config: Partial<database.BotConfigType> &
			Pick<database.BotConfigType, "guildId">
	) {
		const existingConfig = await this.getBotConfig(config.guildId)
		const toSetConfig = database.BotConfig.parse({
			...existingConfig,
			...config,
		})
		await (await this.db)
			.getRepository(BotConfig)
			.upsert({ ...toSetConfig, guildId: config.guildId }, ["guildId"])
		// should exist as the config already exists
		const newConfig = await (await this.db)
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

	async syncCommandPerms(guildId: string) {
		const guildConfig =
			this.guildConfigs.get(guildId) ||
			(await this.getGuildConfig(guildId))
		if (!guildConfig) return false
		const guildCommands = await (await this.db)
			.getRepository(Command)
			.find({
				guildId: guildId,
			})
		if (!guildCommands.length) return false

		type CommandWithPerms = Required<
			CommandType,
			"permissionOverrides" | "permissionType"
		>

		const commandData: CommandWithPerms[] = guildCommands
			.map((command) =>
				this.commands.find((c) => c.data.name === command.name)
			)
			.filter(
				(c): c is CommandWithPerms =>
					Boolean(c?.permissionType) ||
					Boolean(c?.permissionOverrides?.length)
			)
			.map((c) => {
				if (!c.permissionOverrides) c.permissionOverrides = []
				if (!c.permissionType) c.permissionType = "configrole"
				return c
			})
		const toSetPermissions = commandData.map((command) => {
			const guildCommand = guildCommands.find(
				(c) => c.name === command.data.name
			)!
			const perms = command.permissionOverrides.slice()
			perms.push({
				type: ApplicationCommandPermissionTypes.USER,
				id: ENV.OWNERID,
				permission: true,
			})

			if (guildConfig?.roles) {
				switch (command.permissionType) {
					case "banrole": {
						if (guildConfig.roles.reports)
							perms.push({
								type: ApplicationCommandPermissionTypes.ROLE,
								id: guildConfig.roles.reports,
								permission: true,
							})
						break
					}
					case "configrole": {
						if (guildConfig.roles.setConfig)
							perms.push({
								type: ApplicationCommandPermissionTypes.ROLE,
								id: guildConfig.roles.setConfig,
								permission: true,
							})
						break
					}
					case "notificationsrole": {
						if (guildConfig.roles.webhooks)
							perms.push({
								type: ApplicationCommandPermissionTypes.ROLE,
								id: guildConfig.roles.webhooks,
								permission: true,
							})
						break
					}
				}
			}
			return {
				id: guildCommand.id,
				type: command.permissionType,
				permissions: perms,
			}
		})
		await this.guilds.cache.get(guildId)?.commands.permissions.set({
			fullPermissions: toSetPermissions,
		})
	}
}
