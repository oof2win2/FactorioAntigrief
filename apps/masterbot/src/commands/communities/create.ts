import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { AuthenticateUser } from "../../utils/authenticate.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const CreateCommunity: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a FAGC community")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Community name")
				.setRequired(true)
		)
		.addUserOption(option =>
			option
				.setName("contact")
				.setDescription("Community contact or owner")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("guildid")
				.setDescription("Guild ID of the guild the community is in")
				.setRequired(false)
		)
	,
	execute: async (client: FAGCBot, interaction: CommandInteraction) => {
		const user = interaction.user
		if (!(await AuthenticateUser(user))) return interaction.reply("You are not allowed to perform this action")

		const name = interaction.options.getString("name")!
		const contact = interaction.options.getUser("contact")!
		const guildId = interaction.options.getString("guildid")!
		try {
			const community = await client.FAGC.communities.create(name, contact.id, guildId)
			if (community.community) {
				contact.send(`You have created a new community ${name} (\`${community.community.id}\`). Your API key is \`${community.apiKey}\``)
				interaction.reply({
					content: `Community ${name} (\`${community.community.id}\`) has API key \`${community.apiKey}\``,
					ephemeral: true
				})
				return interaction.channel?.send(`Community ${name} (\`${community.community.id}\`) has been created`)
			}
		} catch (e) {
			return interaction.reply(`Error: ${e}`)
		}
	}
}

export default CreateCommunity