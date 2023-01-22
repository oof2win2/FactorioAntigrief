import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import Whitelist from "../../database/Whitelist.js"
import hasFDGLBans from "../../utils/functions/hasFDGLBans.js"

const RemoveWhitelist: SubCommand = {
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

		const found = await client.db.getRepository(Whitelist).findOne({
			playername: playername,
		})
		if (!found)
			return interaction.reply({
				content: `Player ${playername} was not whitelisted`,
				ephemeral: true,
			})

		await client.db.getRepository(Whitelist).delete({
			playername,
		})

		if (client.filterObject) {
			const FDGLBan = await hasFDGLBans({
				playername,
				filter: client.filterObject,
				database: client.db,
			})
			if (FDGLBan) {
				const report = await client.fdgl.reports.fetchReport({
					reportId: FDGLBan.id,
				})
				const bancmd = client.createBanCommand(report!)
				if (bancmd) {
					client.createActionForReport(FDGLBan.playername)
					await client.rcon.rconCommandAll(bancmd)
				}
				return interaction.reply({
					content: `Player ${playername} was unwhitelisted, but was banned due to FDGL report ${FDGLBan.id}`,
				})
			}
		}

		return interaction.reply({
			content: `Player ${playername} has been unwhitelisted by ${interaction.user} for ${reason}`,
		})
	},
}
export default RemoveWhitelist
