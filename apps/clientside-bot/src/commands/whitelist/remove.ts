import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import Whitelist from "../../database/Whitelist.js"
import hasFAGCBans from "../../utils/functions/hasFAGCBans.js"

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

		const result = await client.db.getRepository(Whitelist).delete({
			playername: playername,
		})
		if (!result.affected)
			return interaction.reply({
				content: `Player ${playername} was not whitelisted`,
				ephemeral: true,
			})

		await client.rcon.rconCommandAll(`/whitelist remove ${playername}`)

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
					content: `Player ${playername} was unwhitelisted, but was banned due to FAGC report ${hasBan.id}`,
				})
			}
		}

		return interaction.reply({
			content: `Player ${playername} has been unwhitelisted by ${interaction.user} for ${reason}`,
		})
	},
}
export default Setaction
