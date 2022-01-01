import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig, Community } from "fagc-api-types"
import ENV from "../utils/env.js"
import { Client, ClientOptions, Collection, MessageEmbed } from "discord.js"
import { Command } from "./Commands.js"
import { InfoChannel, PrismaClient } from ".prisma/client/index.js"
import * as database from "./database.js"
import * as wshandler from "./wshandler.js"
import { Report, Revocation } from "fagc-api-types"
import RCONInterface from "./rcon.js"
import fs from "fs"
import { z } from "zod"
import { Required } from "utility-types"
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums"

function getServers(): database.FactorioServerType[] {
	const serverJSON = fs.readFileSync(ENV.SERVERSFILEPATH, "utf8")
	const servers = z.array(database.FactorioServer).parse(JSON.parse(serverJSON))
	return servers
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BotOptions extends ClientOptions {

}
export default class FAGCBot extends Client {
	fagc: FAGCWrapper
	db: PrismaClient
	commands: Collection<string, Command>
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
			enableWebSocket: true
		})
		this.commands = new Collection()

		this.infochannels = new Collection()
		this.embedQueue = new Collection()
		this.servers = new Collection()

		this.botConfigs = new Collection()

		const rawServers = getServers()

		rawServers.map((server) => {
			const existing = this.servers.get(server.discordGuildID)
			if (existing) {
				this.servers.set(server.discordGuildID, [ ...existing, server ])
			} else {
				this.servers.set(server.discordGuildID, [ server ])
			}
		})

		

		this.rcon = new RCONInterface(this, rawServers)

		this.db = new PrismaClient()
		this.db.$connect()

		// load info channels
		this.db.infoChannel.findMany().then(channels => {
			channels.forEach(channel => {
				const existing = this.infochannels.get(channel.guildID)
				if (existing) {
					this.infochannels.set(channel.guildID, [ ...existing, channel ])
				} else {
					this.infochannels.set(channel.guildID, [ channel ])
				}
			})
		})

		this.getBotConfigs().then((configs) => {
			configs.forEach(config => {
				this.botConfigs.set(config.guildID, config)
			})
		})
		
		// parsing WS notifications
		this.fagc.websocket.on("communityCreated", (event) => wshandler.communityCreated({ event, client: this }))
		this.fagc.websocket.on("communityRemoved", (event) => wshandler.communityRemoved({ event, client: this }))
		this.fagc.websocket.on("ruleCreated", (event) => wshandler.ruleCreated({ event, client: this }))
		this.fagc.websocket.on("ruleRemoved", (event) => wshandler.ruleRemoved({ event, client: this }))
		this.fagc.websocket.on("report", (event) => wshandler.report({ event, client: this }))
		this.fagc.websocket.on("revocation", (event) => wshandler.revocation({ event, client: this }))
		this.fagc.websocket.on("guildConfigChanged", (event) => wshandler.guildConfigChanged({ event, client: this }))

		setInterval(() => this.sendEmbeds(), 10*1000) // send embeds every 10 seconds
	}

	async getBotConfigs(): Promise<database.BotConfigType[]> {
		const records = await this.db.botConfig.findMany()
		return z.array(database.BotConfig).parse(records)
	}
	async getBotConfig(guildID: string): Promise<database.BotConfigType> {
		const existing = this.botConfigs.get(guildID)
		if (existing) return existing
		const record = await this.db.botConfig.findFirst({
			where: {
				guildID: guildID,
			}
		})
		const created = database.BotConfig.parse(record ?? { guildID: guildID })
		if (!record) await this.setBotConfig(created)
		return created
	}
	async setBotConfig(config: Partial<database.BotConfigType> & Pick<database.BotConfigType, "guildID">) {
		const existingConfig = await this.getBotConfig(config.guildID)
		const toSetConfig = database.BotConfig.parse({
			...existingConfig,
			...config
		})
		const newConfig = await this.db.botConfig.upsert({
			where: { guildID: config.guildID },
			create: {
				...toSetConfig,
				guildID: config.guildID,
			},
			update: {
				...toSetConfig,
			}
		})
		this.botConfigs.set(config.guildID, database.BotConfig.parse(newConfig))
	}

	private sendEmbeds() {
		for (const [ channelID ] of this.embedQueue) {
			const embeds = this.embedQueue.get(channelID)?.splice(0, 10) ?? []
			if (!embeds.length) continue
			const channel = this.channels.resolve(channelID)
			if (!channel || !channel.isNotDMChannel()) continue
			const infoChannels = this.infochannels.get(channel.guild.id)
			if (!infoChannels) continue
			channel.send({ embeds: embeds })
		}
	}

	addEmbedToQueue(channelID: string, embed: MessageEmbed) {
		const channel = this.channels.resolve(channelID)
		if (!channel || !channel.isNotDMChannel()) return false
		if (this.embedQueue.has(channelID)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			this.embedQueue.set(channelID, [ ...this.embedQueue.get(channelID)!, embed ])
		} else {
			this.embedQueue.set(channelID, [ embed ])
		}
	}

	async getGuildConfig(guildID: string): Promise<GuildConfig | null> {
		const existing = this.guildConfigs.get(guildID)
		if (existing) return existing
		const config = await this.fagc.communities.fetchGuildConfig({ guildId: guildID })
		if (!config) return null
		this.guildConfigs.set(guildID, config)
		return config
	}

	createBanCommand(report: Report, guildID: string) {
		const botConfig = this.botConfigs.get(guildID)
		if (!botConfig || botConfig.reportAction === "none") return false

		const rawBanMessage = botConfig.reportAction === "ban" ? ENV.BANCOMMAND : ENV.CUSTOMBANCOMMAND
		const command = rawBanMessage
			.replaceAll("{ADMINID}", report.adminId)
			.replaceAll("{AUTOMATED}", report.automated ? "true" : "false")
			.replaceAll("{BROKENRULE}", report.brokenRule)
			.replaceAll("{COMMUNITYID}", report.communityId)
			.replaceAll("{REPORTID}", report.id)
			.replaceAll("{DESCRIPTION}", report.description)
			.replaceAll("{PLAYERNAME}", report.playername)
			.replaceAll("{PROOF}", report.proof)
			.replaceAll("{REPORTEDTIME}", report.reportedTime.toISOString())
		return command
	}

	createUnbanCommand(playername: string, guildID: string) {
		const botConfig = this.botConfigs.get(guildID)
		if (!botConfig || botConfig.revocationAction === "none") return false

		const rawUnbanMessage = botConfig.reportAction === "ban" ? ENV.UNBANCOMMAND : ENV.CUSTOMUNBANCOMMAND
		const command = rawUnbanMessage
			.replaceAll("{PLAYERNAME}", playername)
		return command
	}

	async ban(report: Report, guildID: string) {
		const command = this.createBanCommand(report, guildID)
		if (!command) return
		
		this.rcon.rconCommandGuild(command, guildID)
	}

	async unban(revocation: Revocation, guildID: string) {
		const servers = this.servers.get(guildID)
		if (!servers || !servers.length) return
		const botConfig = await this.getBotConfig(guildID)
		if (!botConfig || botConfig.revocationAction === "none") return

		const rawUnbanMessage = botConfig.revocationAction === "unban" ? ENV.UNBANCOMMAND : ENV.CUSTOMUNBANCOMMAND

		const command = rawUnbanMessage
			.replace("{ADMINID}", revocation.adminId)
			.replace("{AUTOMATED}", revocation.automated ? "true" : "false")
			.replace("{BROKENRULE}", revocation.brokenRule)
			.replace("{COMMUNITYID}", revocation.communityId)
			.replace("{REPORTID}", revocation.id)
			.replace("{DESCRIPTION}", revocation.description)
			.replace("{PLAYERNAME}", revocation.playername)
			.replace("{PROOF}", revocation.proof)
			.replace("{REPORTEDTIME}", revocation.reportedTime.toTimeString())
		
		this.rcon.rconCommandGuild(command, guildID)
	}
	
	async syncCommandPerms(guildID: string) {
		const guildConfig = this.guildConfigs.get(guildID) || await this.getGuildConfig(guildID)
		if (!guildConfig) return false
		const guildCommands = await this.db.command.findMany({
			where: {
				guildID: guildID
			}
		})
		if (!guildCommands.length) return false

		type CommandWithPerms = Required<Command, "permissionOverrides" | "permissionType">

		const commandData: CommandWithPerms[] = guildCommands
			.map(command => this.commands.find(c => c.data.name === command.name))
			.filter((c): c is CommandWithPerms => Boolean(c?.permissionType) || Boolean(c?.permissionOverrides?.length))
			.map(c=> {
				if (!c.permissionOverrides) c.permissionOverrides = []
				if (!c.permissionType) c.permissionType = "configrole"
				return c
			})
		const toSetPermissions = commandData.map((command) => {
			const guildCommand = guildCommands.find(c => c.name === command.data.name)!
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
							permission: true
						})
					break
				}
				case "configrole": {
					if (guildConfig.roles.setConfig)
						perms.push({
							type: ApplicationCommandPermissionTypes.ROLE,
							id: guildConfig.roles.setConfig,
							permission: true
						})
					break
				}
				case "notificationsrole": {
					if (guildConfig.roles.webhooks)
						perms.push({
							type: ApplicationCommandPermissionTypes.ROLE,
							id: guildConfig.roles.webhooks,
							permission: true
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
		await this.guilds.cache.get(guildID)?.commands.permissions.set({
			fullPermissions: toSetPermissions,
		})
	}
}