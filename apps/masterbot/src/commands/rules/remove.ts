import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const CreateRule: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a FAGC rule")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("Rule ID")
				.setRequired(true)
		)
	,
	execute: async (client: FAGCBot, interaction: CommandInteraction) => {		
		const user = interaction.user

		const id = interaction.options.getString("id")
		if (!id) return interaction.reply("Rule id not provided")

		const rule = await client.FAGC.rules.remove({
			id: id
		})

		if (!rule) return interaction.reply(`Rule with ID \`${id}\` does not exist`)
		return interaction.reply(`Rule ${rule.shortdesc} (\`${rule.id}\`) was removed`)
	}
}

export default CreateRule