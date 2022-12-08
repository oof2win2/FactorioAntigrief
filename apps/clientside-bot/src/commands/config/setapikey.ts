import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"

const Setapikey: SubCommand = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("setapikey")
		.setDescription("Set the API key")
		.addStringOption((option) =>
			option
				.setName("apikey")
				.setDescription("FDGL API key")
				.setRequired(true)
		),
	execute: async ({ client, interaction, botConfig }) => {
		const apikey = z
			.string()
			.safeParse(interaction.options.getString("apikey"))
		if (!apikey.success) {
			return interaction.reply({
				content: "API key was invalid",
				ephemeral: true,
			})
		}
		try {
			const community = await client.fdgl.communities.fetchOwnCommunity({
				reqConfig: {
					apikey: apikey.data,
				},
			})
			if (!community) {
				return interaction.reply({
					content: `\`${apikey.data}\` is an invalid API key`,
					ephemeral: true,
				})
			}
		} catch {
			return interaction.reply({
				content: `\`${apikey.data}\` is an invalid API key`,
				ephemeral: true,
			})
		}
		client.fdgl.setdata({
			apikey: apikey.data,
		})
		await client.setBotConfig({
			guildId: interaction.guildId,
			apikey: apikey.data,
		})

		await interaction.reply({
			content: `API key has been set to ||\`${apikey.data}\`||`,
			ephemeral: true,
		})
		await interaction.channel?.send(
			`${interaction.user} has set the API key`
		)

		await client.users
			.fetch(botConfig.owner)
			.then((owner) =>
				owner.send(
					`User ${interaction.user} has set your API key to ||\`${apikey.data}\`||`
				)
			)
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			.catch(() => {})
	},
}
export default Setapikey
