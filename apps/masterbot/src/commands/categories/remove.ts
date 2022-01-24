import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const CreateCategory: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a FAGC category")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("Category ID")
				.setRequired(true)
		)
	,
	execute: async ({client, interaction}) => {		
		const user = interaction.user

		const id = interaction.options.getString("id")
		if (!id) return interaction.reply("Category id not provided")

		const category = await client.FAGC.categories.remove({
			categoryId: id
		})

		if (!category) return interaction.reply(`Category with ID \`${id}\` does not exist`)
		return interaction.reply(`Category ${category.shortdesc} (\`${category.id}\`) was removed`)
	}
}

export default CreateCategory