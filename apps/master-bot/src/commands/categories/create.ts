import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const CreateCategory: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a FAGC category")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Category Name")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("description")
				.setDescription("Category description")
				.setRequired(true)
		)
	,
	execute: async ({ client, interaction }) => {
		const user = interaction.user

		const name = interaction.options.getString("name")
		if (!name) return interaction.reply("Category name not provided")
		const description = interaction.options.getString("description")
		if (!description) return interaction.reply("Category description not provided")

		const category = await client.FAGC.categories.create({
			category: {
				name: name,
				description: description
			}
		})

		return interaction.reply(`Category ${category.name} (\`${category.id}\`) was created`)
	}
}

export default CreateCategory