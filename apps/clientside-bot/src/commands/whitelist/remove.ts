import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a whitelist entry")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Name of the player to unwhitelist")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setDescription("Reason for the unwhitelist")
				.setRequired(false)
		),
	execute: async ({ client, interaction }) => {
		const playername = z
			.string()
			.parse(interaction.options.getString("playername"))
		const reason = z
			.string()
			.default("No reason")
			.parse(interaction.options.getString("reason") ?? undefined)

		const result = await client.db.whitelist.deleteMany({
			where: {
				playername: playername,
			},
		})
		if (!result.count)
			return interaction.reply({
				content: `Player ${playername} was not whitelisted`,
				ephemeral: true,
			})

		return interaction.reply({
			content: `Player ${playername} has been unwhitelisted by ${interaction.user} for ${reason}`,
		})
	},
}
export default Setaction
