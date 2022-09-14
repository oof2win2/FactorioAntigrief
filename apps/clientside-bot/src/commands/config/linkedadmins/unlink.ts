import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SubCommand } from "../../../base/Commands.js"
import LinkedAdmin from "../../../database/LinkedAdmin.js"

const Setaction: SubCommand = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("unlink")
		.setDescription(
			"Unlink yourself or another user from a Factorio account"
		)
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Factorio playername")
				.setRequired(false)
		)
		.addUserOption((option) =>
			option.setName("user").setDescription("User").setRequired(false)
		),
	execute: async ({ client, interaction }) => {
		const playername = interaction.options.getString("playername")
		const user = interaction.options.getUser("user")

		if (playername) {
			const deleted = await client.db.getRepository(LinkedAdmin).delete({
				playername,
			})

			if (deleted.affected) {
				return interaction.reply({
					content: `Player ${playername} is unlinked`,
					ephemeral: true,
				})
			} else {
				return interaction.reply({
					content: `Player ${playername} was not linked`,
					ephemeral: true,
				})
			}
		} else if (user) {
			const deleted = await client.db.getRepository(LinkedAdmin).delete({
				discordId: user.id,
			})

			if (deleted.affected) {
				return interaction.reply({
					content: `User <@${user.id}> is unlinked`,
					ephemeral: true,
				})
			} else {
				return interaction.reply({
					content: `User <@${user.id}> was not linked`,
					ephemeral: true,
				})
			}
		} else {
			return interaction.reply({
				content:
					"Please provide either a playername or a user to unlink",
				ephemeral: true,
			})
		}
	},
}
export default Setaction
