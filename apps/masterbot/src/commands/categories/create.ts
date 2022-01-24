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
				.setName("shortdesc")
				.setDescription("Short category description")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("longdesc")
				.setDescription("Long category description")
				.setRequired(true)
		)
	,
	execute: async ({client, interaction}) => {
		const user = interaction.user

		const shortdesc = interaction.options.getString("shortdesc")
		if (!shortdesc) return interaction.reply("Category short description not provided")
		const longdesc = interaction.options.getString("longdesc")
		if (!longdesc) return interaction.reply("Category long description not provided")

		const category = await client.FAGC.categories.create({
			category: {
				shortdesc: shortdesc,
				longdesc: longdesc
			}
		})

		return interaction.reply(`Category ${category.shortdesc} (\`${category.id}\`) was created`)
	}
}

export default CreateCategory