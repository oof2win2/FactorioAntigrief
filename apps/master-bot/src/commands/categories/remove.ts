import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FDGLBot from "../../utils/FDGLBot.js"

const CreateCategory: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a FDGL category")
		.addStringOption((option) =>
			option.setName("id").setDescription("Category ID").setRequired(true)
		),
	execute: async ({ client, interaction }) => {
		const user = interaction.user

		const id = interaction.options.getString("id")
		if (!id) return interaction.reply("Category id not provided")

		const category = await client.FDGL.categories.remove({
			categoryId: id,
		})

		if (!category)
			return interaction.reply(
				`Category with ID \`${id}\` does not exist`
			)
		return interaction.reply(
			`Category ${category.name} (\`${category.id}\`) was removed`
		)
	},
}

export default CreateCategory
