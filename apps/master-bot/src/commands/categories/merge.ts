import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const EditCategory: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("merge")
		.setDescription("Merge the dissolving category into the receiving category")
		.addStringOption(option =>
			option
				.setName("receiving")
				.setDescription("ID of category that will be receiving")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("dissolving")
				.setDescription("ID of the category that will be dissolved")
				.setRequired(true)
		)
	,
	execute: async ({ client, interaction }) => {
		const idReceiving = interaction.options.getString("receiving", true)
		const idDissolving = interaction.options.getString("dissolving", true)
		
		const receiving = await client.FAGC.categories.fetchCategory({ categoryId: idReceiving })
		if (!receiving) return interaction.reply({
			content: `Category ID \`${idReceiving}\` does not exist`,
			ephemeral: true
		})
		const dissolving = await client.FAGC.categories.fetchCategory({ categoryId: idDissolving })
		if (!dissolving) return interaction.reply({
			content: `Category ID \`${idDissolving}\` does not exist`,
			ephemeral: true
		})

		const merged = await client.FAGC.categories.merge({
			idReceiving: idReceiving,
			idDissolving: idDissolving,
		})
		return interaction.reply(`Successfully merged category \`${idDissolving}\` into \`${idReceiving}\``)
	}
}

export default EditCategory