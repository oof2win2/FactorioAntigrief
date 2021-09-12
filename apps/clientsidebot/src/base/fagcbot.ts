import { Client, ClientOptions, Collection, HexColorString, Snowflake, TextChannel } from "discord.js"
import * as path from "path"
import { BotConfig } from "../types/FAGCBot"

import {
	GuildConfigHandler,
	ReportHandler,
	RevocationHandler,
	RuleCreatedHandler,
	RuleRemovedHandler
} from "./websockethandler.js"

import { InfoChannels } from "@prisma/client"
import { PrismaClient } from ".prisma/client/index.js"

import config from "../config.js"
import Logger, { LogType } from "../utils/logger.js"
import { GuildConfig } from ".prisma/client"
import { FAGCConfig } from "../types/FAGC.js"
import { CommandWithSubcommands, PermissionOverride, PermissionOverrideType } from "./Command.js"

import { FAGCWrapper } from "fagc-api-wrapper"
import { Report } from "fagc-api-types"
import fs from "fs"
import { HandleUnfilteredRevocation, HandleUnfilteredReport } from "./FAGCHandler.js"
import ENV from "../utils/env.js"
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface FAGCBotOptions extends ClientOptions {
}

class FAGCBot extends Client {
	public config: BotConfig
	public RateLimit: Collection<Snowflake, number>
	public logger: (message: unknown, type?: LogType) => void
	public prisma: PrismaClient
	static GuildConfig: GuildConfig
	static infochannels: InfoChannels[]
	static fagcconfig: FAGCConfig
	static config: BotConfig
	public fagc: FAGCWrapper
	private lastNotificationProcessed: Date

	public commands: Collection<string, CommandWithSubcommands>
	constructor(options: FAGCBotOptions) {
		super(options)

		this.config = config
		FAGCBot.config = config

		// setup rate limit
		this.RateLimit = new Collection()

		this.commands = new Collection()
		fs.readdirSync("./commands")
			.filter(command => command.endsWith(".js"))
			.forEach(async commandFile => {
				const command = await import(`../commands/${commandFile}`)
				const commandName = commandFile.slice(0, commandFile.indexOf(".js"))
				this.commands.set(commandName, command.default)
			})

		this.logger = Logger

		this.prisma = new PrismaClient()
		FAGCBot.GuildConfig = null
		FAGCBot.fagcconfig = null

		this.fagc = new FAGCWrapper({
			apiurl: this.config.apiurl,
			socketurl: this.config.websocketurl,
		})

		this.fagc.websocket.on("communityConfigChanged", (GuildConfig) => {
			this.lastNotificationProcessed = new Date()
			GuildConfigHandler(GuildConfig)
		})
		this.fagc.websocket.on("report", async (report) => {
			console.log("report created")
			this.lastNotificationProcessed = new Date()
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			ReportHandler(report, this, channels)
		})
		this.fagc.websocket.on("revocation", async (revocation) => {
			console.log("revocation created")
			this.lastNotificationProcessed = new Date()
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			RevocationHandler(revocation, this, channels)
		})
		this.fagc.websocket.on("ruleCreated", async (rule) => {
			this.lastNotificationProcessed = new Date()
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			RuleCreatedHandler(rule, this, channels)
		})
		this.fagc.websocket.on("ruleRemoved", async (rule) => {
			this.lastNotificationProcessed = new Date()
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			RuleRemovedHandler(rule, this, channels)
		})

		// used to figure out when the last processed notification was during startup
		setInterval(() => {
			if (FAGCBot.GuildConfig) {
				this.setConfig({
					...FAGCBot.GuildConfig,
					lastNotificationProcessed: this.lastNotificationProcessed
				})
			}
		}, 5 * 60 * 1000)

		setTimeout(() => {
			if (!FAGCBot.GuildConfig) this.refreshCommandPerms().then(() => this.refreshCommandPerms())
		}, 5000)


		this._asyncInit()
	}
	async _asyncInit(): Promise<void> {
		await this.getConfig()

		const lastNotificationProcessed = FAGCBot.GuildConfig?.lastNotificationProcessed || new Date()
		this.lastNotificationProcessed = new Date()

		FAGCBot.infochannels = await this.prisma.infoChannels.findMany()

		const reportsSince = await this.fagc.reports.fetchModifiedSince(lastNotificationProcessed)
		reportsSince.forEach(report => HandleUnfilteredReport(report, this))
		const revocationsSince = await this.fagc.revocations.fetchModifiedSince(lastNotificationProcessed)
		revocationsSince.forEach(revocation => HandleUnfilteredRevocation(revocation, this))
	}
	/**
	 * Check if a user has sent a command in the past X milliseconds
	 * @param {string} uid - Discord user's ID snowflake
	 * @param {Number} time - Time in ms to check
	 * @returns {Boolean} True if the user has sent a command, false if they haven't
	 */
	checkTimeout(uid: Snowflake, time: number): boolean {
		const lastTime = this.RateLimit.get(uid)
		if (!lastTime) return false
		if (lastTime < (Date.now() - time)) return false
		return true
	}
	async getConfig(): Promise<GuildConfig> {
		if (FAGCBot.GuildConfig) return FAGCBot.GuildConfig
		const config = await this.prisma.guildConfig.findFirst()
		if (!config) return null
		FAGCBot.GuildConfig = config
		this.getGuildConfig()
		if (config.apikey) this.fagc.apikey = config.apikey
		return config
	}
	async setConfig(config: GuildConfig): Promise<GuildConfig> {
		FAGCBot.GuildConfig = config
		if (FAGCBot.GuildConfig) {
			const update = await this.prisma.guildConfig.update({
				data: config,
				where: { id: 1 }
			})
			return update
		} else {
			const set = await this.prisma.guildConfig.create({ data: config })
			this.fagc.websocket.setGuildID(FAGCBot.GuildConfig.guildId)
			return set
		}
	}
	async getGuildConfig(): Promise<FAGCConfig> {
		if (FAGCBot.fagcconfig) return FAGCBot.fagcconfig
		// this case should like literally never happen as the config will get sent when it is updated. here just in case.
		FAGCBot.fagcconfig = {
			...await this.fagc.communities.fetchConfig(FAGCBot.GuildConfig.guildId),
			apikey: FAGCBot.GuildConfig.apikey
		}
		// setTimeout(() => FAGCBot.fagcconfig = undefined, 1000 * 60 * 15) // times itself out after 
		return FAGCBot.fagcconfig
	}
	async getFilteredReports(playername: string): Promise<Report[]> {
		if (!FAGCBot.fagcconfig?.ruleFilters || !FAGCBot.fagcconfig?.trustedCommunities) return []
		const allReports = await this.fagc.reports.fetchAllName(playername)
		const configFilteredReports = allReports.filter(report => {
			return (FAGCBot.fagcconfig.trustedCommunities.includes(report.communityId)
				&& FAGCBot.fagcconfig.ruleFilters.includes(report.brokenRule))
		})
		const filteredReports = await Promise.all(configFilteredReports.filter(async (report) => {
			const ignored = await this.prisma.ignoredReports.findFirst({ where: { reportId: report.id } })
			if (ignored?.id) return null // the report is ignored so don't give it back
			return report
		}))
		return filteredReports.filter(report => report) // remove nulls
	}
	getEmbedColor(): HexColorString {
		return this.config.embeds.color[0] == "#" ? <HexColorString>this.config.embeds.color : `#${this.config.embeds.color}`
	}

	async refreshCommandPerms() {
		const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)
		const apicommands = await this.prisma.commands.findMany()

		const isSetUp = FAGCBot.GuildConfig || false
		const everyoneRole = this.guilds.cache.first().roles.everyone

		await Promise.all(apicommands.map(async (apicommand) => {
			const command = this.commands.find(c => c.data.name === apicommand.name)!

			const permissions: PermissionOverride[] = isSetUp ? command.permission_overrides : [{
				id: everyoneRole.id,
				type: PermissionOverrideType.ROLE,
				permission: false
			}]
			if (command.data.name === "config") permissions.push({
				id: this.config.owner.id,
				type: PermissionOverrideType.USER,
				permission: true
			})

			return await rest.put(
				Routes.applicationCommandPermissions(this.user.id, ENV.TESTGUILDID, apicommand.id),
				{ body: { permissions: permissions } }
			)
		}))
	}
}

export default FAGCBot
