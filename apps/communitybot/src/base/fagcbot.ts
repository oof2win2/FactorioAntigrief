import { Client, ClientOptions, Collection } from "discord.js"
import { FAGCWrapper } from "fagc-api-wrapper"
import ENV from "../utils/env"
import CONFIG from "./config"
import { Command } from "./Command"
import { GuildConfig } from "fagc-api-types"

export default class FAGCBot extends Client {
	config: typeof CONFIG
	emotes: typeof CONFIG["emotes"]
	env = ENV
	RateLimit: Collection<string, number>
	fagc: FAGCWrapper
	commands: Map<string, Command>
	aliases: Map<string, string>

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

		this.commands = new Map()
		this.aliases = new Map()
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

	async getFilteredRules(config) {
		const allRules = await this.fagc.rules.fetchAll({})
		const filteredRules = allRules
			.filter((rule) => config.ruleFilters.some((id) => id === rule.id))
			.sort(
				(a, b) =>
					config.ruleFilters.indexOf(a.id) - config.ruleFilters.indexOf(b.id),
			)
		return filteredRules
	}
	async saveGuildConfig(
		config: Partial<GuildConfig> & {
			roles?: Partial<GuildConfig["roles"]>
		} & Pick<GuildConfig, "guildId"> & { apikey?: string },
	) {
		if (config.apikey) {
			// if the guild has an API key, it can be set by themselves
			return this.fagc.communities.setGuildConfig({
				config: config,
				reqConfig: {
					apikey: config.apikey,
				},
			})
		} else {
			// since there is no api key, we set the guild config ourselves
			return this.fagc.communities.setGuildConfigMaster({
				config: config,
			})
		}
	}
}
