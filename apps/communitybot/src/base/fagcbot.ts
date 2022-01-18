import { Client, ClientOptions, Collection } from "discord.js"
import path from "path"
import { FAGCWrapper } from "fagc-api-wrapper"
import ENV from "../utils/env"
import CONFIG from "./config"
import { Command } from "./Command"
import {GuildConfig} from "fagc-api-types"

export default class FAGCBot extends Client {
	config: typeof CONFIG
	emotes: typeof CONFIG["emotes"]
	RateLimit: Collection<string, number>
	fagc: FAGCWrapper
	commands: Collection<string, Command<any>>
	aliases: Collection<string, string>

	constructor(options: ClientOptions) {
		super(options)

		this.config = CONFIG
		this.emotes = this.config.emotes

		// setup rate limit
		this.RateLimit = new Collection()

		this.fagc = new FAGCWrapper({
			apiurl: ENV.APIURL,
			enableWebSocket: false,
			socketurl: "",
			masterapikey: ENV.MASTERAPIKEY,
		})

		this.commands = new Collection()
		this.aliases = new Collection()
	}
	/**
	 * Check if a user has sent a command in the past X milliseconds
	 * @param {String} uid - Discord user's ID snowflake
	 * @param {Number} time - Time in ms to check
	 * @returns {Boolean} True if the user has sent a command, false if they haven't
	 */
	checkTimeout(uid: string, time: number): boolean {
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
			command = this.commands.get(this.aliases.get(commandName) ?? "")
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
		const allRules = await this.fagc.rules.fetchAll({})
		const filteredRules = allRules
			.filter((rule) =>
				config.ruleFilters.some((id) => id === rule.id)
			)
			.sort((a, b) => config.ruleFilters.indexOf(a.id) - config.ruleFilters.indexOf(b.id))
		return filteredRules
	}
	async saveGuildConfig(config: Partial<GuildConfig> & Pick<GuildConfig, "guildId"> & {apikey?: string}) {
		if (config.apikey) {
			return this.fagc.communities.setGuildConfig({
				config: config,
				reqConfig: {
					apikey: config.apikey
				}
			})
		}
		// TODO: implement https://github.com/FactorioAntigrief/fagc-backend/issues/304 first, then saving configs without api keys can work
		// const newConfig = await ConfigModel.findOneAndUpdate(
		// 	{ guildId: config.guildId },
		// 	config,
		// 	{ upsert: true, new: true }
		// )
		// await this.fagc.communities.notifyGuildConfig({
		// 	guildID: config.guildID
		// })
		// return newConfig
	}
}