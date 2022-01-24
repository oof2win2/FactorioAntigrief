import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const EditCategory: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edit a FAGC category")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("ID of category to edit")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("shortdesc")
				.setDescription("Short category description")
				.setRequired(false)
		)
		.addStringOption(option =>
			option
				.setName("longdesc")
				.setDescription("Long category description")
				.setRequired(false)
		)
	,
	execute: async ({client, interaction}) => {
		const user = interaction.user

		const id = interaction.options.getString("id", true)
		const shortdesc = interaction.options.getString("shortdesc")
		const longdesc = interaction.options.getString("longdesc")
		if (!shortdesc && !longdesc) return interaction.reply({
			content: "No changes would be made!",
			ephemeral: true
		})

		const category = await client.FAGC.categories.modify({
			id: id,
			shortdesc: shortdesc ?? undefined,
			longdesc: longdesc ?? undefined,
		})
		
		if (!category) return interaction.reply({
			content: `Category with ID ${id} does not exist, no action was performed`,
			ephemeral: true
		})

		return interaction.reply(`Category \`${category.id}\` was edited. Changes may take a ~5 minutes to take effect. ${category.shortdesc}: ${category.longdesc}`)
	}
}

export default EditCategory