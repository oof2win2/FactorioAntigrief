import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const EditRule: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("merge")
		.setDescription("Merge the dissolving rule into the receiving rule")
		.addStringOption(option =>
			option
				.setName("receiving")
				.setDescription("ID of rule that will be receiving")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("dissolving")
				.setDescription("ID of the rule that will be dissolved")
				.setRequired(true)
		)
	,
	execute: async ({client, interaction}) => {
		const idReceiving = interaction.options.getString("receiving", true)
		const idDissolving = interaction.options.getString("dissolving", true)
		
		const receiving = await client.FAGC.rules.fetchRule({ruleid: idReceiving})
		if (!receiving) return interaction.reply({
			content: `Rule ID \`${idReceiving}\` does not exist`,
			ephemeral: true
		})
		const dissolving = await client.FAGC.rules.fetchRule({ruleid: idDissolving})
		if (!dissolving) return interaction.reply({
			content: `Rule ID \`${idDissolving}\` does not exist`,
			ephemeral: true
		})

		const merged = await client.FAGC.rules.merge({
			idReceiving: idReceiving,
			idDissolving: idDissolving,
		})
		return interaction.reply(`Successfully merged rule \`${idDissolving}\` into \`${idReceiving}\``)
	}
}

export default EditRule