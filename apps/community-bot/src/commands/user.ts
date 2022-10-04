import { Command } from "../base/Command"
import { SlashCommandBuilder } from "@discordjs/builders"
import { Formatters } from "discord.js"

const User: Command<false, false> = {
	type: "Command",
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Gets a Discord user")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to get")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("The user id to get")
				.setRequired(false)
		),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client, filters }) => {
		const uid = interaction.options.getString("id")

		try {
			let user = interaction.options.getUser("user")

			if (!user) {
				if (!uid)
					return interaction.reply({
						content: "Please provide either a user or an id",
						ephemeral: true,
					})

				user = await client.users.fetch(uid)
			}

			const embed = client
				.createBaseEmbed()
				.setImage(user.avatarURL() || "")
				.addFields([
					{ name: "User's ID", value: user.id, inline: true },
					{ name: "User's tag", value: user.tag, inline: true },
					{
						name: "User created at",
						value: Formatters.time(user.createdAt),
						inline: true,
					},
				])
			interaction.reply({
				embeds: [embed],
			})
		} catch {
			return interaction.reply(
				`User with the ID ${uid} could not be found`
			)
		}
	},
}

export default User
