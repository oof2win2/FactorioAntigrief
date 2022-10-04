import {
	Client,
	ClientOptions,
	Collection,
	Message,
	MessageEmbed,
} from "discord.js"
import { FAGCWrapper } from "fagc-api-wrapper"
import ENV from "../utils/env"
import CONFIG from "./config"
import type { CommandConfig, SlashCommand } from "./Command"
import {
	Category,
	FilterObject,
	SetFilterObject,
	SetGuildConfig,
} from "fagc-api-types"

export default class FAGCBot extends Client {
	config: typeof CONFIG
	emotes: typeof CONFIG["emotes"]
	env = ENV
	RateLimit: Collection<string, number>
	fagc: FAGCWrapper
	commands: Map<string, SlashCommand<boolean, boolean>>
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

	async getFilteredCategories(filter: FilterObject): Promise<Category[]> {
		const allCategories = await this.fagc.categories.fetchAll({})
		const filteredCategories = allCategories
			.filter((category) =>
				filter.categoryFilters.some((id) => id === category.id)
			)
			.sort(
				(a, b) =>
					filter.categoryFilters.indexOf(a.id) -
					filter.categoryFilters.indexOf(b.id)
			)
		return filteredCategories
	}
	async saveGuildConfig(config: SetGuildConfig) {
		return this.fagc.communities.setGuildConfigMaster({
			config: config,
		})
	}

	async saveFilters(filter: SetFilterObject, communityId: string | null) {
		return this.fagc.communities.setMasterFilters({
			filter,
			communityId,
		})
	}

	async safeGetContactString(userId: string): Promise<string> {
		const user = await this.users.fetch(userId).catch(() => null)
		if (!user) return `User ${userId} not found`
		return `<@${user.id}> | ${user.tag}`
	}

	async getConfirmationMessage(
		message: Message,
		content: string,
		timeout = 120000
	): Promise<boolean> {
		const confirm = await message.channel.send(content)
		confirm.react("✅")
		confirm.react("❌")
		const reactions = await confirm.awaitReactions({
			filter: (r, u) => u.id === message.author.id,
			max: 1,
			time: timeout,
			errors: [],
		})
		const reaction = reactions.first()
		if (!reaction) return false
		if (reaction.emoji.name === "❌") return false
		return true
	}

	async getMessageResponse(
		message: Message,
		content: string,
		timeout = 30000
	): Promise<Message | null> {
		const msg = await message.channel.send(content)
		return (
			(
				await msg.channel.awaitMessages({
					filter: (m) => m.author.id === message.author.id,
					max: 1,
					time: timeout,
				})
			).first() || null
		)
	}

	async argsOrInput(
		args: string[],
		message: Message,
		content: string
	): Promise<string | null> {
		const arg = args.shift()
		if (arg) return arg

		const newMessage = await this.getMessageResponse(message, content)
		if (!newMessage) return null
		return newMessage.content.split(" ")[0]
	}

	createBaseEmbed() {
		return new MessageEmbed()
			.setColor(this.config.embeds.color)
			.setTimestamp()
			.setAuthor({ name: this.config.embeds.author })
			.setFooter({ text: this.config.embeds.footer })
	}
}
