import {
	MessageEmbed,
	EmbedField,
	Message,
	MessageEmbedOptions,
	MessageOptions,
	Guild,
	MessagePayload,
	User,
	CommandInteraction,
	MessageButton,
	MessageActionRow,
} from "discord.js"
import { readdirSync } from "fs"
import { SubCommand, SubCommandGroup } from "../base/Command"
import FAGCBot from "../base/fagcbot"

/**
 * Create the pagination components
 * @param {number} page - Current page. -1 if disabled
 * @param {number} count - Page count
 */
const makePaginationComponents = (page: number, count: number) => {
	if (count <= 1) return []

	return [
		new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId("first")
				.setLabel("First")
				.setStyle("PRIMARY")
				.setEmoji("⏮️")
				.setDisabled(page === 0 || page === -1),
			new MessageButton()
				.setCustomId("previous")
				.setLabel("Previous")
				.setStyle("PRIMARY")
				.setEmoji("⬅️")
				.setDisabled(page === 0 || page === -1),
			new MessageButton()
				.setCustomId("next")
				.setLabel("Next")
				.setStyle("PRIMARY")
				.setEmoji("➡️")
				.setDisabled(page === count - 1 || page === -1),
			new MessageButton()
				.setCustomId("last")
				.setLabel("Last")
				.setStyle("PRIMARY")
				.setEmoji("⏭️")
				.setDisabled(page === count - 1 || page === -1),
			new MessageButton()
				.setCustomId("cancel")
				.setLabel("Cancel")
				.setStyle("DANGER")
				.setEmoji("🗑️")
				.setDisabled(page === -1)
		),
	]
}

export async function createPagedEmbed(
	fields: EmbedField[],
	embedMsgOptions: MessageEmbed | MessageEmbedOptions,
	messageOrInteraction: Message | CommandInteraction,
	target: User,
	options: {
		maxPageCount?: number
		followUp?: boolean
		timeout?: number
	} = { timeout: 120000, followUp: false }
) {
	const newOptions = {
		maxPageCount: 25,
		...options,
	}
	if (newOptions.maxPageCount > 25) newOptions.maxPageCount = 25 // discord limit is 25 fields per embed

	let page = 0
	const embed = new MessageEmbed(embedMsgOptions)

	// if the amount of pages is 1 then there is actually only one page, f.e. 5/5 = 1 but the program will work with 0, 1
	const maxPages = Math.floor(fields.length / newOptions.maxPageCount)
	embed.fields = fields.slice(0, options.maxPageCount)

	let message: Message
	if (messageOrInteraction instanceof Message)
		message = await messageOrInteraction.reply({
			embeds: [embed],
			components: makePaginationComponents(page, maxPages),
		})
	else {
		let method: "editReply" | "reply" | "followUp" = options.followUp
			? "followUp"
			: "reply"
		if (
			method === "reply" &&
			(messageOrInteraction.replied || messageOrInteraction.deferred)
		)
			method = "editReply"
		message = (await messageOrInteraction[method]({
			embeds: [embed],
			components: makePaginationComponents(page, maxPages),
			fetchReply: true,
		})) as Message
	}

	if (maxPages <= 1) return

	const makeNewContent = () => {
		const start = page * newOptions.maxPageCount

		// Only update fields if not ended
		if (page !== -1)
			embed.fields = fields.slice(start, start + newOptions.maxPageCount)

		return {
			embeds: [embed],
			components: makePaginationComponents(page, maxPages),
		}
	}

	const collector = message.createMessageComponentCollector({
		componentType: "BUTTON",
		filter: (i) => i.user.id === target.id,
		time: options.timeout,
	})

	collector.on("collect", (i) => {
		switch (i.customId) {
			case "first":
				page = 0
				break
			case "previous":
				page--
				break
			case "next":
				page++
				break
			case "last":
				page = maxPages - 1
				break
			case "cancel":
				i.deferUpdate()
				collector.stop()
				return
		}

		i.update(makeNewContent())
		collector.resetTimer()
	})

	collector.once("end", () => {
		page = -1
		console.log("end")
		message.edit(makeNewContent())
	})
}

export async function sendToGuild(
	guild: Guild,
	options: string | MessagePayload | MessageOptions
) {
	const guildOwner = await guild.fetchOwner()

	const owner = () => {
		guildOwner
			.send(options)
			.catch(() =>
				console.log(`Could not send embed for guild ID ${guild.id}`)
			)
	}

	const systemChannel = () => {
		if (guild.systemChannel)
			guild.systemChannel.send(options).catch(() => owner())
		else owner()
	}

	const publicUpdates = () => {
		if (guild.publicUpdatesChannel)
			guild.publicUpdatesChannel
				.send(options)
				.catch(() => systemChannel())
		else systemChannel()
	}
	publicUpdates()
}

export async function afterJoinGuild(guild: Guild, client: FAGCBot) {
	// create initial config only if it doesn't exist yet
	client.fagc.communities
		.fetchGuildConfig({
			guildId: guild.id,
		})
		.then((config) => {
			if (config) return
			console.log(`Creating config for guild with ID ${guild.id}`)
			client.fagc.communities.createGuildConfig({
				guildId: guild.id,
			})
		})
	const embed = client.createBaseEmbed().setTitle("Welcome to FAGC")
	embed.addFields(
		{ name: "FAGC Invite", value: client.config.fagcInvite },
		{
			name: "Initial Setup",
			value:
				"We assume that you want to set your guild up. For now, your guild data has been set to a few defaults, " +
				`such as the guild contact being the guild's owner. Everything with the API is readonly until you run \`${client.env.BOTPREFIX}setapikey\`. ` +
				`Run \`${client.env.BOTPREFIX}help\` to view command help. Commands don't work in DMs!`,
		},
		{
			name: "Bot Prefix",
			value: `The bot prefix is, and always will be, \`${client.env.BOTPREFIX}\`. This is displayed in the bot's status`,
		}
	)

	sendToGuild(guild, {
		embeds: [embed],
	})
}

export function loadSubcommands(
	...commandName: string[]
): (SubCommand<boolean, boolean> | SubCommandGroup)[] {
	const path = `${__dirname}/../commands/${commandName.join("/")}`

	return readdirSync(path)
		.filter((command) => command.endsWith(".js"))
		.map((endCommand) => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const command = require(`${path}/${endCommand}`)
			return command.default
		})
}
