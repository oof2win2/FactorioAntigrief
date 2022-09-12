import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SubCommand } from "../../../base/Commands.js"
import LinkedAdmin from "../../../database/LinkedAdmin.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("check")
		.setDescription("Check whether a player or user is linked")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Factorio playername")
				.setRequired(false)
		)
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("User to check link status for")
				.setRequired(false)
		),
	execute: async ({ client, interaction }) => {
		const playername = interaction.options.getString("playername")
		const user = interaction.options.getUser("user")

		if (playername) {
			const found = await client.db.getRepository(LinkedAdmin).findOne({
				where: {
					playername,
				},
			})

			if (found) {
				return interaction.reply({
					content: `Player ${playername} is linked with <@${found.discordId}>`,
					ephemeral: true,
				})
			} else {
				return interaction.reply({
					content: `Player ${playername} is not linked`,
					ephemeral: true,
				})
			}
		} else if (user) {
			const found = await client.db.getRepository(LinkedAdmin).findOne({
				where: {
					discordId: user.id,
				},
			})

			if (found) {
				return interaction.reply({
					content: `User <@${user.id}> is linked with ${found.discordId}`,
					ephemeral: true,
				})
			} else {
				return interaction.reply({
					content: `User <@${user.id}> is not linked`,
					ephemeral: true,
				})
			}
		} else {
			return interaction.reply({
				content: "Please provide either a playername or a user",
				ephemeral: true,
			})
		}
	},
}
export default Setaction
