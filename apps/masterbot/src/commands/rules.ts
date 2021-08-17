import { SlashCommandBuilder } from '@discordjs/builders';
import { AuthenticateUser } from '../utils/authenticate.js';
import Command from '../utils/Command.js';

const CreateRule: Command = {
	data: new SlashCommandBuilder()
		.setName("rules")
		.setDescription("FAGC Rules")
		.addSubcommand(subcommand => 
			subcommand
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
			)
		.addSubcommand(subcommand =>
			subcommand
				.setName("remove")
				.setDescription("Remove a FAGC rule")
				.addStringOption(option =>
					option
						.setName("id")
						.setDescription("Rule ID")
						.setRequired(true)
				)
		)
	,
	execute: async (client, interaction) => {
		switch (interaction.options.getSubcommand()!) {
			case "create": {
				const user = interaction.user
				if (!(await AuthenticateUser(user))) return interaction.reply("You are not allowed to perform this action")

				const shortdesc = interaction.options.getString("shortdesc")
				if (!shortdesc) return interaction.reply("Rule short description not provided")
				const longdesc = interaction.options.getString("longdesc")
				if (!longdesc) return interaction.reply("Rule long description not provided")

				const rule = await client.FAGC.rules.create({
					shortdesc: shortdesc,
					longdesc: longdesc
				})

				return interaction.reply(`Rule ${rule.shortdesc} (\`${rule.id}\`) was created`)
			}
			case "remove": {
				const user = interaction.user
				if (!(await AuthenticateUser(user))) return interaction.reply("You are not allowed to perform this action")

				const id = interaction.options.getString("id")
				if (!id) return interaction.reply("Rule id not provided")

				const rule = await client.FAGC.rules.remove(id)
				
				if (!rule) return interaction.reply(`Rule with ID \`${id}\` does not exist`)
				return interaction.reply(`Rule ${rule.shortdesc} (\`${rule.id}\`) was removed`)
			}
			default:
				return interaction.reply("Case not implemented")
		}
	}
}
export default CreateRule