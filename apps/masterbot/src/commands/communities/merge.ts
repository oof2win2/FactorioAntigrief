import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const EditRule: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("merge")
		.setDescription("Merge the dissolving community into the receiving community")
		.addStringOption(option =>
			option
				.setName("receiving")
				.setDescription("ID of community that will be receiving")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("dissolving")
				.setDescription("ID of the community that will be dissolved")
				.setRequired(true)
		)
	,
	execute: async ({client, interaction}) => {
		const idReceiving = interaction.options.getString("receiving", true)
		const idDissolving = interaction.options.getString("dissolving", true)
		
		const receiving = await client.FAGC.communities.fetchCommunity({communityID: idReceiving})
		if (!receiving) return interaction.reply({
			content: `Community with the ID \`${idReceiving}\` does not exist`,
			ephemeral: true
		})
		const dissolving = await client.FAGC.communities.fetchCommunity({communityID: idDissolving})
		if (!dissolving) return interaction.reply({
			content: `Community with the ID \`${idDissolving}\` does not exist`,
			ephemeral: true
		})

		await client.FAGC.communities.merge({
			idReceiving: idReceiving,
			idDissolving: idDissolving,
		})
		return interaction.reply(`Successfully merged community \`${idDissolving}\` into \`${idReceiving}\``)
	}
}

export default EditRule