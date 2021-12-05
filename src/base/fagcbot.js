const { Client, Collection } = require("discord.js")
const path = require("path")
const { FAGCWrapper } = require("fagc-api-wrapper")
const ConfigModel = require("../database/schemas/config")
const ENV = require("../utils/env")

class FAGCBot extends Client {
	constructor(options) {
		super(options)

		this.config = require("../../config")
		this.env = ENV
		this.emotes = this.config.emotes

		// setup rate limit
		this.RateLimit = new Collection()

		this.fagc = new FAGCWrapper({
			apiurl: this.env.APIURL,
			enableWebSocket: false,
			socketurl: "",
			masterapikey: this.env.MASTERAPIKEY,
		})

		this.commands = new Collection()
		this.aliases = new Collection()
		// ["commands", "aliases"].forEach(x => this[x] = new Collection());
		// ["command", "event"].forEach((x) => require(`../handlers/${x}`)(this));
		this.logger = require("../utils/logger")
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
	loadCommand(commandPath, commandName) {
		// load a command
		try {
			const props =
				new (require(`.${commandPath}${path.sep}${commandName}`))(this) // gets properties
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
	async unloadCommand(commandPath, commandName) {
		// unload a command
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
		delete require.cache[
			require.resolve(`.${commandPath}${path.sep}${commandName}.js`)
		]
		return false
	}

	async getFilteredRules(config) {
		const allRules = await this.fagc.rules.fetchAll()
		const filteredRules = allRules.filter((rule) =>
			config.ruleFilters.some((id) => id === rule.id)
		)
		return filteredRules
	}

	async saveGuildConfig(config) {
		if (config.apikey) {
			return this.fagc.communities.setGuildConfig(config, {
				apikey: config.apikey,
			})
		}
		const newConfig = await ConfigModel.findOneAndUpdate(
			{ guildId: config.guildId },
			config,
			{ upsert: true, new: true }
		)
		await this.fagc.communities.notifyGuildConfig(config.guildId)
		return newConfig
	}
}
module.exports = FAGCBot
