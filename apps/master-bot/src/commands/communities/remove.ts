import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FDGLBot from "../../utils/FDGLBot.js"

const CreateCommunity: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a FDGL community")
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("Community ID")
				.setRequired(true)
		),
	execute: async ({ client, interaction }) => {
		const user = interaction.user

		const id = interaction.options.getString("id")!
		try {
			const community = await client.FDGL.communities.remove({
				communityId: id,
			})
			if (community) {
				return interaction.reply(
					`Community with ID \`${id}\` has been removed`
				)
			}
		} catch (e) {
			return interaction.reply(`Error: ${e}`)
		}
	},
}

export default CreateCommunity
