import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import Whitelist from "../../database/Whitelist.js"
import hasFAGCBans from "../../utils/functions/hasFAGCBans.js"

const Setaction: SubCommand = {
	type: "SubCommand",
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

		const result = await client.db.getRepository(Whitelist).delete({
			playername: playername,
		})
		if (!result.affected)
			return interaction.reply({
				content: `Player ${playername} was not whitelisted`,
				ephemeral: true,
			})

		if (client.filterObject) {
			const FAGCBan = await hasFAGCBans({
				playername,
				filter: client.filterObject,
				database: client.db,
			})
			if (FAGCBan) {
				const report = await client.fagc.reports.fetchReport({
					reportId: FAGCBan.id,
				})
				const bancmd = client.createBanCommand(report!)
				if (bancmd) {
					client.createActionForReport(FAGCBan.playername)
					await client.rcon.rconCommandAll(bancmd)
				}
				return interaction.reply({
					content: `Player ${playername} was unwhitelisted, but was banned due to FAGC report ${FAGCBan.id}`,
				})
			}
		}

		return interaction.reply({
			content: `Player ${playername} has been unwhitelisted by ${interaction.user} for ${reason}`,
		})
	},
}
export default Setaction
