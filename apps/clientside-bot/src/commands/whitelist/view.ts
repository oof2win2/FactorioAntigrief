import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import Whitelist from "../../database/Whitelist.js"

const Setaction: SubCommand = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("View a whitelist entry")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Name of the player to view")
				.setRequired(true)
		),
	execute: async ({ client, interaction }) => {
		const playername = z
			.string()
			.parse(interaction.options.getString("playername"))

		const existing = await client.db.getRepository(Whitelist).findOne({
			playername: playername,
		})

		// TODO: check if they are currently banned on servers due to FDGL and state if so, unban them
		if (existing) {
			return interaction.reply({
				content: `Player ${playername} is whitelisted by <@${
					existing.adminId
				}> since <t:${Math.round(
					existing.createdAt.valueOf() / 1000
				)}> for ${existing.reason}`,
				ephemeral: true,
			})
		} else {
			return interaction.reply({
				content: `Player ${playername} is not whitelisted`,
				ephemeral: true,
			})
		}
	},
}
export default Setaction
