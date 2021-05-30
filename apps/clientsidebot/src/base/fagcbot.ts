// const { Client, Collection } = require("discord.js")
import {Client, Collection, Snowflake} from "discord.js"
import * as path from "path"
import fetch from "node-fetch"
import * as WebSocket from "ws"
import { BotConfig, BotConfigEmotes } from "../types/FAGCBot"

import WebSocketHandler from "./websockethandler"

import { PrismaClient } from "@prisma/client"

import * as config from "../../config"
import Logger, { LogType } from "../utils/logger"
import { Config } from ".prisma/client"
import { FAGCConfig } from "../types/FAGC"
import Command from "./Command"

class FAGCBot extends Client {
	public config: BotConfig
	static emotes: BotConfigEmotes
	public RateLimit: Collection<Snowflake, number>
	public commands: Collection<string, Command>
	public aliases: Collection<string, string>
	public logger: (message: String, type?: LogType) => void
	public prisma: PrismaClient
	static botconfig: Config
	static fagcconfig: FAGCConfig
	public wsHandler: (arg0: Object, arg1: FAGCBot) => void
	private messageSocket: WebSocket
	constructor(options) {
		super(options)

		this.config = config
		FAGCBot.emotes = this.config.emotes

		// setup rate limit
		this.RateLimit = new Collection()

		this.commands = new Collection()
		this.aliases = new Collection()
		this.logger = Logger

		// this.db = require("../database/Database")
		this.prisma = new PrismaClient()
		FAGCBot.botconfig = null
		FAGCBot.fagcconfig = null

		this.wsHandler = WebSocketHandler
		this.messageSocket = new WebSocket("ws://localhost:8001")
		this.messageSocket.on("message", (message) => {
			this.wsHandler(message, this)
		})
		this._asyncInit()
	}
	async _asyncInit() {
		await this.getConfig()
		if (FAGCBot.botconfig) this.messageSocket.send(Buffer.from(JSON.stringify({
			guildid: FAGCBot.botconfig.guildid
		})))
		await this.getGuildConfig()
	}
	/**
	 * Check if a user has sent a command in the past X milliseconds
	 * @param {string} uid - Discord user's ID snowflake
	 * @param {Number} time - Time in ms to check
	 * @returns {Boolean} True if the user has sent a command, false if they haven't
	 */
	checkTimeout(uid: Snowflake, time: number) {
		const lastTime = this.RateLimit.get(uid)
		if (!lastTime) return false
		if (lastTime < (Date.now() - time)) return false
		return true
	}
	loadCommand(commandPath: string, commandName: string) { // load a command
		try {
			const props = new (require(`.${commandPath}${path.sep}${commandName}`))(this) // gets properties
			props.config.location = commandPath // finds location
			if (props.init) {
				props.init(this)
			}
			this.commands.set(props.help.name, props) // adds command to commands collection
			props.help.aliases.forEach((alias) => {
				this.aliases.set(alias, props.help.name) // adds command to alias collection
			})
			return false
		} catch (e) {
			return `Unable to load command ${commandName}: ${e}`
		}
	}
	async unloadCommand(commandPath, commandName) { // unload a command
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
	async getConfig() {
		if (FAGCBot.botconfig) return FAGCBot.botconfig
		const config = await this.prisma.config.findFirst()
		if (!config) return null
		FAGCBot.botconfig = config
		return config
	}
	async setConfig(config) {
		if (FAGCBot.botconfig) {
			const update = await this.prisma.config.update({
				data: config,
				where: {id: 1}
			})
			return update
		} else {
			const set = await await this.prisma.config.create({data: config})
			if (set.id) {
				// tell the websocket to the api that we have this guild ID
				this.messageSocket.send({
					guildid: FAGCBot.botconfig.guildid
				})

				FAGCBot.botconfig = set
				return set
			} else return set
		}
	}
	async getGuildConfig() {
		if (FAGCBot.fagcconfig) return FAGCBot.fagcconfig
		FAGCBot.fagcconfig = await fetch(`${this.config.apiurl}/communities/getconfig?guildid=${FAGCBot.botconfig.guildid}`).then(c => c.json())
		setTimeout(() => FAGCBot.fagcconfig = undefined, 1000*60*15) // times itself out after 
		return FAGCBot.fagcconfig
	}
}

export default FAGCBot