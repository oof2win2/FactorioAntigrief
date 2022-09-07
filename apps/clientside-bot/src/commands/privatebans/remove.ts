import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import PrivateBan from "../../database/PrivateBan.js"
import hasFAGCBans from "../../utils/functions/hasFAGCBans"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a private ban")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Name of the player to unban")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setDescription("Reason for the unban")
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

		const result = await client.db.getRepository(PrivateBan).delete({
			playername: playername,
		})
		if (!result.affected)
			return interaction.reply({
				content: `Player ${playername} was not banned`,
				ephemeral: true,
			})

		await client.rcon.rconCommandAll(`/unban ${playername}`)

		if (client.filterObject) {
			const hasBan = await hasFAGCBans({
				playername,
				filter: client.filterObject,
				database: client.db,
			})
			if (hasBan) {
				const report = await client.fagc.reports.fetchReport({
					reportId: hasBan.id,
				})
				const bancmd = client.createBanCommand(report!)
				if (bancmd) await client.rcon.rconCommandAll(bancmd)
				return interaction.reply({
					content: `Player ${playername} was unbanned privately, but was banned due to FAGC report ${hasBan.id}`,
				})
			}
		}

		return interaction.reply({
			content: `Player ${playername} has been unbanned by ${interaction.user} for ${reason}`,
		})
	},
}
export default Setaction
