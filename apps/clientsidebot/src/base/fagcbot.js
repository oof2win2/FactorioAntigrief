const { Client, Collection } = require("discord.js")
const path = require("path")
const fetch = require("node-fetch")
const WebSocket = require("ws")
const WebSocketHandler = require("./websockethandler")

const { PrismaClient } = require("@prisma/client")

class FAGCBot extends Client {
	constructor(options) {
		super(options)

		this.config = require("../../config")
		this.emotes = this.config.emotes

		// setup rate limit
		this.RateLimit = new Collection()

		this.commands = new Collection()
		this.aliases = new Collection()
		this.logger = require("../utils/logger")

		// this.db = require("../database/Database")
		this.prisma = new PrismaClient()
		this.botconfig = undefined
		this.fagcconfig = undefined

		this.wsHandler = WebSocketHandler
		this.messageSocket = new WebSocket("ws://localhost:8001")
		this.messageSocket.on("message", (message) => {
			this.wsHandler(message, this)
		})
		this._asyncInit()
	}
	async _asyncInit() {
		await this.getConfig()
		await this.getGuildConfig()
	}
	/**
	 * Check if a user has sent a command in the past X milliseconds
	 * @param {String} uid - Discord user's ID snowflake
	 * @param {Number} time - Time in ms to check
	 * @returns {Boolean} True if the user has sent a command, false if they haven't
	 */
	checkTimeout(uid, time) {
		const lastTime = this.RateLimit.get(uid)
		if (!lastTime) return false
		if (lastTime < Date.now() - time) return false
		return true
	}
	loadCommand(commandPath, commandName) { // load a command
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
		if (this.botconfig) return this.botconfig
		const config = await this.prisma.config.findFirst()
		if (!config) return null
		this.botconfig = config
		return config
	}
	async setConfig(config) {
		if (this.botconfig) {
			const update = await this.prisma.config.update({
				data: config,
				where: {id: 1}
			})
			return update
		} else {
			const set = await await this.prisma.config.create({data: config})
			if (set.id) {
				this.botconfig = set
				return set
			} else return set
		}
	}
	async getGuildConfig() {
		if (this.fagcconfig) return this.fagcconfig
		this.fagcconfig = await fetch(`${this.config.apiurl}/communities/getconfig?guildid=${this.botconfig.guildid}`).then(c => c.json())
		setTimeout(() => this.fagcconfig = undefined, 1000*60*15) // times itself out after 
		return this.fagcconfig
	}
}
module.exports = FAGCBot