import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const CreateRule: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a FAGC rule")
		.addStringOption(option =>
			option
				.setName("shortdesc")
				.setDescription("Short rule description")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("longdesc")
				.setDescription("Long rule description")
				.setRequired(true)
		)
	,
	execute: async (client: FAGCBot, interaction: CommandInteraction) => {
		const user = interaction.user

		const shortdesc = interaction.options.getString("shortdesc")
		if (!shortdesc) return interaction.reply("Rule short description not provided")
		const longdesc = interaction.options.getString("longdesc")
		if (!longdesc) return interaction.reply("Rule long description not provided")

		const rule = await client.FAGC.rules.create({
			rule: {
				shortdesc: shortdesc,
				longdesc: longdesc
			}
		})

		return interaction.reply(`Rule ${rule.shortdesc} (\`${rule.id}\`) was created`)
	}
}

export default CreateRule