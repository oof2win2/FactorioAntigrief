import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"
import PrivateBan from "../../database/PrivateBan.js"
import dayjs from "dayjs"

const Setaction: SubCommand = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a private ban")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Name of the player to ban")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setDescription("Reason for the ban")
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

		const existing = await client.db.getRepository(PrivateBan).findOne({
			playername: playername,
		})
		if (existing)
			return interaction.reply({
				content: `Player ${playername} was already banned by <@${
					existing.adminId
				}> on <t:${Math.round(
					existing.createdAt.valueOf() / 1000
				)}> for ${existing.reason}`,
				ephemeral: true,
			})

		await client.db.getRepository(PrivateBan).insert({
			adminId: interaction.user.id,
			playername: playername,
			reason: reason,
		})

		client.createActionForReport(playername)
		await client.rcon.rconCommandAll(
			`/ban ${playername} ${reason} by ${interaction.user.username}#${
				interaction.user.discriminator
			} on ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`
		)

		return interaction.reply({
			content: `Player ${playername} is now banned for ${reason}`,
		})
	},
}
export default Setaction
