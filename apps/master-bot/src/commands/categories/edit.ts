import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FDGLBot from "../../utils/FDGLBot.js"

const EditCategory: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edit a FDGL category")
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("ID of category to edit")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("shortdesc")
				.setDescription("Category name")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("description")
				.setDescription("Category description")
				.setRequired(false)
		),
	execute: async ({ client, interaction }) => {
		const user = interaction.user

		const id = interaction.options.getString("id", true)
		const name = interaction.options.getString("name")
		const description = interaction.options.getString("description")
		if (!name && !description)
			return interaction.reply({
				content: "No changes would be made!",
				ephemeral: true,
			})

		const category = await client.FDGL.categories.modify({
			categoryId: id,
			name: name ?? undefined,
			description: description ?? undefined,
		})

		if (!category)
			return interaction.reply({
				content: `Category with ID ${id} does not exist, no action was performed`,
				ephemeral: true,
			})

		return interaction.reply(
			`Category \`${category.id}\` was edited. Changes may take ~5 minutes to take effect. ${category.name}: ${category.description}`
		)
	},
}

export default EditCategory
