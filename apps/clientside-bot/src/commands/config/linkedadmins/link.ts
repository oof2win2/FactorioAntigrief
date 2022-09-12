import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../../base/Commands.js"
import { BotConfigType } from "../../../base/database.js"
import LinkedAdmin from "../../../database/LinkedAdmin.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("link")
		.setDescription("Link yourself with a Factorio playername")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Factorio playername")
				.setRequired(true)
		),
	execute: async ({ client, interaction }) => {
		const playername = interaction.options.getString("playername", true)

		const found = await client.db.getRepository(LinkedAdmin).findOne({
			where: {
				playername,
			},
		})

		if (found)
			return interaction.reply({
				content: `Player ${playername} is already linked with <@${found.discordId}>`,
				ephemeral: true,
			})

		await client.db.getRepository(LinkedAdmin).insert({
			playername,
			discordId: interaction.user.id,
		})

		const botConfig = client.botConfig
		return interaction.reply({
			content: `Report action is ${botConfig.reportAction}. Revocation action is ${botConfig.revocationAction}`,
		})
	},
}
export default Setaction
