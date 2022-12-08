import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { AuthError } from "@fdgl/wrapper"
import { SubCommand } from "../../../base/Command"

const ConfigSetName: SubCommand<true, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("name")
		.setDescription("Set your community's name")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("What to set as name")
				.setRequired(true)
		),
	requiredPermissions: ["setConfig"],
	requiresRoles: true,
	requiresApikey: true,
	fetchFilters: false,
	execute: async ({ interaction, client, guildConfig }) => {
		if (!guildConfig.apikey)
			return interaction.reply(
				`${client.emotes.warn} You must have an API key set for this command`
			)

		const name = interaction.options.getString("name", true)

		const confirmation = await client.getConfirmation(
			interaction,
			`Are you sure you want to set your community's name to ${name}?`,
			interaction.user
		)

		if (!confirmation)
			return interaction.followUp(`${client.emotes.warn} Cancelled`)

		try {
			await client.fdgl.communities.setCommunityConfig({
				config: {
					name: name,
				},
				reqConfig: {
					apikey: guildConfig.apikey,
				},
			})
			return interaction.followUp(
				`Community name set to ${name} successfully. Changes may take a few minutes to take effect`
			)
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.followUp(
					`${client.emotes.warn} Your API key is not recognized by FDGL`
				)
			}
			throw e
		}
	},
}

export default ConfigSetName
