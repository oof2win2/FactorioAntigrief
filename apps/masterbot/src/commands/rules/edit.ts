import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { AuthenticateUser } from "../../utils/authenticate.js"
import { SubCommand } from "../../utils/Command.js"
import FAGCBot from "../../utils/FAGCBot.js"

const EditRule: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edit a FAGC rule")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("ID of rule to edit")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("shortdesc")
				.setDescription("Short rule description")
				.setRequired(false)
		)
		.addStringOption(option =>
			option
				.setName("longdesc")
				.setDescription("Long rule description")
				.setRequired(false)
		)
	,
	execute: async (client: FAGCBot, interaction: CommandInteraction) => {
		const user = interaction.user
		if (!(await AuthenticateUser(user))) return interaction.reply("You are not allowed to perform this action")

		const id = interaction.options.getString("id", true)
		const shortdesc = interaction.options.getString("shortdesc")
		const longdesc = interaction.options.getString("longdesc")
		if (!shortdesc && !longdesc) return interaction.reply({
			content: "No changes would be made!",
			ephemeral: true
		})

		const rule = await client.FAGC.rules.modify(id, {
			shortdesc: shortdesc ?? undefined,
			longdesc: longdesc ?? undefined
		})
		if (!rule) return interaction.reply({
			content: `Rule with ID ${id} does not exist, no action was performed`,
			ephemeral: true
		})

		return interaction.reply(`Rule \`${rule.id}\` was edited. Changes may take a ~5 minutes to take effect. ${rule.shortdesc}: ${rule.longdesc}`)
	}
}

export default EditRule