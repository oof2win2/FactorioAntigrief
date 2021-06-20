import { Client, ClientOptions, Collection, Snowflake, TextChannel } from "discord.js"
import * as path from "path"
import fetch from "node-fetch"
import WebSocket from "ws"
import { BotConfig, BotConfigEmotes } from "../types/FAGCBot"

import {
	GuildConfigHandler,
	ReportHandler,
	RevocationHandler,
	RuleCreatedHandler,
	RuleRemovedHandler
} from "./websockethandler"

import { InfoChannels, PrismaClient } from "@prisma/client"

import config from "../../config"
import Logger, { LogType } from "../utils/logger"
import { GuildConfig } from ".prisma/client"
import { FAGCConfig } from "../types/FAGC"
import Command from "./Command"

import ServerHandler from "./serverhandler"
import servers from "../../servers"
import { FAGCWrapper, Report, Revocation, Rule } from "fagc-api-wrapper"

interface FAGCBotOptions extends ClientOptions {
}

class FAGCBot extends Client {
	public config: BotConfig
	static emotes: BotConfigEmotes
	public RateLimit: Collection<Snowflake, number>
	public commands: Collection<string, Command>
	public aliases: Collection<string, string>
	public logger: (message: unknown, type?: LogType) => void
	public prisma: PrismaClient
	static GuildConfig: GuildConfig
	static infochannels: InfoChannels[]
	static fagcconfig: FAGCConfig
	static config: BotConfig
	public wsHandler: (arg0: unknown, arg1: FAGCBot) => void // TODO: create type for API messages and use it here
	private messageSocket: WebSocket
	public fagc: FAGCWrapper
	private ServerHandler: ServerHandler
	constructor(options: FAGCBotOptions) {
		super(options)

		this.config = config
		FAGCBot.config = config
		FAGCBot.emotes = this.config.emotes

		// setup rate limit
		this.RateLimit = new Collection()

		this.commands = new Collection()
		this.aliases = new Collection()
		this.logger = Logger

		this.prisma = new PrismaClient()
		FAGCBot.GuildConfig = null
		FAGCBot.fagcconfig = null

		this.ServerHandler = new ServerHandler(servers, this)

		this.fagc = new FAGCWrapper({
			apiurl: this.config.apiurl,
			socketurl: this.config.websocketurl,
		})

		this.fagc.websocket.on("guildConfig", async (GuildConfig) => {
			GuildConfigHandler(GuildConfig, this)
		})
		this.fagc.websocket.on("report", async (report: Report) => {
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			ReportHandler(report, this, channels)
		})
		this.fagc.websocket.on("revocation", async (revocation: Revocation) => {
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			RevocationHandler(revocation, this, channels)
		})
		this.fagc.websocket.on("ruleCreated", async (rule: Rule) => {
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			RuleCreatedHandler(rule, this, channels)
		})
		this.fagc.websocket.on("ruleRemoved", async (rule: Rule) => {
			const channels = await Promise.all(FAGCBot.infochannels.map(infochannel => this.channels.fetch(infochannel.channelid))) as TextChannel[]
			RuleRemovedHandler(rule, this, channels)
		})

		
		this._asyncInit()
	}
	async _asyncInit(): Promise<void> {
		await this.getConfig()
		FAGCBot.infochannels = await this.prisma.infoChannels.findMany()
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
	async loadCommand(commandPath: string, commandName: string): Promise<boolean | string> { // load a command
		try {
			const command = (await import(`.${commandPath}${path.sep}${commandName}`))?.command
			this.commands.set(command.name, command) // adds command to commands collection
			command.aliases?.forEach((alias: string) => {
				this.aliases.set(alias, command.name) // adds command to alias collection
			})
			return false
		} catch (e) {
			return `Unable to load command ${commandName}: ${e}`
		}
	}
	async unloadCommand(commandPath: string, commandName: string): Promise<boolean | string> { // unload a command
		let command
		if (this.commands.has(commandName)) {
			command = this.commands.get(commandName)
		} else if (this.aliases.has(commandName)) {
			command = this.commands.get(this.aliases.get(commandName))
		}
		if (!command) {
			return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`
		}
		if (command.shutdown) {
			await command.shutdown(this)
		}
		delete require.cache[require.resolve(`.${commandPath}${path.sep}${commandName}.js`)]
		return false
	}
	async getConfig(): Promise<GuildConfig> {
		if (FAGCBot.GuildConfig) return FAGCBot.GuildConfig
		const config = await this.prisma.guildConfig.findFirst()
		if (!config) return null
		FAGCBot.GuildConfig = config
		if (config.apikey) this.fagc.apikey = config.apikey
		return config
	}
	async setConfig(config: GuildConfig): Promise<GuildConfig> {
		if (FAGCBot.GuildConfig) {
			const update = await this.prisma.guildConfig.update({
				data: config,
				where: { id: 1 }
			})
			return update
		} else {
			const set = await this.prisma.guildConfig.create({ data: config })
			if (set.id) {
				FAGCBot.GuildConfig = set
				// tell the websocket to the api that we have this guild ID
				// this.messageSocket.send(Buffer.from(JSON.stringify({
				// 	guildId: FAGCBot.GuildConfig.guildId
				// })))

				return set
			} else return set
		}
	}
	async getGuildConfig(): Promise<FAGCConfig> {
		if (FAGCBot.fagcconfig) return FAGCBot.fagcconfig
		// this case should like literally never happen as the config will get sent when it is updated. here just in case.
		FAGCBot.fagcconfig = await fetch(`${this.config.apiurl}/communities/getconfig?guildId=${FAGCBot.GuildConfig.guildId}`).then(c => c.json())
		setTimeout(() => FAGCBot.fagcconfig = undefined, 1000 * 60 * 15) // times itself out after 
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
			const ignored = await this.prisma.ignoredViolations.findFirst({where: {violationId: report.id}})
			if (ignored.id) return null // the report is ignored so don't give it back
			return report
		}))
		return filteredReports.filter(report=>report) // remove nulls
	}
}

export default FAGCBot
