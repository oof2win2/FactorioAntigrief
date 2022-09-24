import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import PrivateBan from "../../database/PrivateBan.js"
import hasFAGCBans from "../../utils/functions/hasFAGCBans"

const Setaction: SubCommand = {
	type: "SubCommand",
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

		const found = await client.db.getRepository(PrivateBan).findOne({
			playername,
		})
		if (!found)
			return interaction.reply({
				content: `Player ${playername} was not banned`,
				ephemeral: true,
			})

		if (client.rcon.offlineServerCount > 0) {
			await client.db.getRepository(PrivateBan).update(
				{
					playername,
				},
				{
					removedAt: new Date(),
				}
			)
		} else {
			await client.db.getRepository(PrivateBan).delete({
				playername,
			})
		}

		client.createActionForUnban(playername)
		await client.rcon.rconCommandAll(`/unban ${playername}`)

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
					content: `Player ${playername} was unbanned privately, but was banned due to FAGC report ${FAGCBan.id}`,
				})
			}
		}

		return interaction.reply({
			content: `Player ${playername} has been unbanned by ${interaction.user} for ${reason}`,
		})
	},
}
export default Setaction
