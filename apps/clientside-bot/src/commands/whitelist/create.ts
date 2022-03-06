import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import Whitelist from "../../database/Whitelist.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a whitelist entry")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Name of the player to whitelist")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setDescription("Reason for the whitelist")
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

		const existing = await client.db.getRepository(Whitelist).findOne({
			playername: playername,
		})
		if (existing)
			return interaction.reply({
				content: `Player ${playername} is already whitelisted by <@${
					existing.adminId
				}> since <t:${Math.round(
					existing.createdAt.valueOf() / 1000
				)}> for ${existing.reason}`,
				ephemeral: true,
			})

		await client.db.getRepository(Whitelist).insert({
			adminId: interaction.user.id,
			playername: playername,
			reason: reason,
		})
		return interaction.reply({
			content: `Player ${playername} is now whitelisted for ${reason}`,
		})
	},
}
export default Setaction
