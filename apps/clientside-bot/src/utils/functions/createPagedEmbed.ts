import {
	APIEmbed,
	ComponentType,
	EmbedField,
	User,
	EmbedBuilder,
	Message,
	CommandInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageActionRowComponentBuilder,
} from "discord.js"

/**
 * Create the pagination components
 * @param {number} page - Current page. -1 if disabled
 * @param {number} count - Page count
 */
const makePaginationComponents = (page: number, count: number) => {
	if (count < 1) return []

	return [
		new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("first")
				.setLabel("First")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("⏮️")
				.setDisabled(page === 0 || page === -1),
			new ButtonBuilder()
				.setCustomId("previous")
				.setLabel("Previous")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("⬅️")
				.setDisabled(page === 0 || page === -1),
			new ButtonBuilder()
				.setCustomId("next")
				.setLabel("Next")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("➡️")
				.setDisabled(page === count - 1 || page === -1),
			new ButtonBuilder()
				.setCustomId("last")
				.setLabel("Last")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("⏭️")
				.setDisabled(page === count - 1 || page === -1),
			new ButtonBuilder()
				.setCustomId("cancel")
				.setLabel("Cancel")
				.setStyle(ButtonStyle.Danger)
				.setEmoji("🗑️")
				.setDisabled(page === -1)
		),
	]
}

export async function createPagedEmbed(
	fields: EmbedField[],
	embedMsgOptions: APIEmbed | EmbedBuilder,
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
	const embed = EmbedBuilder.from(embedMsgOptions)

	// if the amount of pages is 1 then there is actually only one page, f.e. 5/5 = 1 but the program will work with 0, 1
	const maxPages = Math.ceil(fields.length / newOptions.maxPageCount)
	embed.setFields(fields.slice(0, newOptions.maxPageCount))

	let message: Message
	if (messageOrInteraction instanceof Message)
		message = await messageOrInteraction.reply({
			embeds: [embed],
			components: makePaginationComponents(page, maxPages),
		})
	else {
		let method: "editReply" | "reply" | "followUp" = newOptions.followUp
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
			embed.setFields(
				fields.slice(start, start + newOptions.maxPageCount)
			)

		return {
			embeds: [embed],
			components: makePaginationComponents(page, maxPages),
		}
	}

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (i) => i.user.id === target.id,
		time: newOptions.timeout,
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
		message.edit(makeNewContent())
	})
}
