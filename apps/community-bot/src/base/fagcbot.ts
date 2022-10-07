import {
	Client,
	ClientOptions,
	Collection,
	CommandInteraction,
	Message,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	User,
} from "discord.js"
import { FAGCWrapper } from "fagc-api-wrapper"
import ENV from "../utils/env"
import CONFIG from "./config"
import type { SlashCommand } from "./Command"
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

	async getConfirmation(
		messageOrInteraction: Message | CommandInteraction,
		content: string,
		user: User,
		timeout = 120000
	): Promise<boolean> {
		const buttons = [
			new MessageButton()
				.setCustomId("yes")
				.setLabel("Yes")
				.setStyle("SUCCESS"),
			new MessageButton()
				.setCustomId("no")
				.setLabel("No")
				.setStyle("DANGER"),
		]

		let message: Message
		if (messageOrInteraction instanceof Message)
			message = (await messageOrInteraction.channel.send({
				content,
				components: [new MessageActionRow().addComponents(buttons)],
			})) as Message
		else {
			let method: "editReply" | "reply" = "reply"
			if (messageOrInteraction.replied || messageOrInteraction.deferred)
				method = "editReply"

			message = (await messageOrInteraction[method]({
				content,
				components: [new MessageActionRow().addComponents(buttons)],
				fetchReply: true,
			})) as Message
		}

		const response = await message
			.awaitMessageComponent({
				filter: (i) => i.user.id === user.id,
				time: timeout,
				componentType: "BUTTON",
			})
			.then((i) => {
				i.deferUpdate()
				return i
			})
			.catch(() => null)

		await message.edit({
			components: [
				new MessageActionRow().addComponents(
					buttons.map((b) => {
						// Disable buttons
						b.setDisabled(true)
						// Set style to secondary
						if (b.customId !== response?.customId)
							b.setStyle("SECONDARY")
						return b
					})
				),
			],
		})

		return response?.customId === "yes"
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
