import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { AuthenticateUser } from "../../utils/authenticate.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const CreateCommunity: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a FAGC community")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("Community ID")
				.setRequired(true)
		)
	,
	execute: async (client: FAGCBot, interaction: CommandInteraction) => {
		const user = interaction.user
		if (!(await AuthenticateUser(user))) return interaction.reply("You are not allowed to perform this action")

		const id = interaction.options.getString("id")!
		
		try {
			const community = await client.FAGC.communities.remove(id)
			if (community) {
				return interaction.reply(`Community with ID \`${id}\` has been removed`)
			}
		} catch (e) {
			return interaction.reply(`Error: ${e}`)
		}
	}
}

export default CreateCommunity