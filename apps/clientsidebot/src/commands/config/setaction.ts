import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("setaction")
		.setDescription("Set an action which happens on report or revocation creation")
		.addStringOption(option => 
			option
				.setName("report")
				.setDescription("Action to perform on report creation")
				.setRequired(false)
				.addChoice("ban", "ban")
				.addChoice("custom", "custom")
				.addChoice("none", "none")
		)
		.addStringOption(option => 
			option
				.setName("revocation")
				.setDescription("Action to perform on revocation creation")
				.setRequired(false)
				.addChoice("unban", "unban")
				.addChoice("custom", "custom")
				.addChoice("none", "none")
		)
	,
	execute: async ({ client, interaction }) => {
		const revocation = z.enum([ "unban", "custom", "none" ]).nullable().parse(interaction.options.getString("revocation"))
		const report = z.enum([ "ban", "custom", "none" ]).nullable().parse(interaction.options.getString("report"))
		
		await client.setGuildAction({
			guildID: interaction.guildId,
			report: report ?? undefined,
			revocation: revocation ?? undefined,
		})

		const guildAction = await client.getGuildAction(interaction.guildId)
		if (!guildAction) return interaction.reply("An error occured")
		return interaction.reply({
			content: `Report action is ${guildAction.report}. Revocation action is ${guildAction.revocation}`
		})
	}
}
export default Setaction