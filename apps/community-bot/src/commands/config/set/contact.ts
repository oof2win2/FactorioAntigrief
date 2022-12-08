import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { AuthError } from "@fdgl/wrapper"
import { SubCommand } from "../../../base/Command"

const ConfigSetContact: SubCommand<true, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("contact")
		.setDescription("Set your community's contact")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("User to set as contact")
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

		const user = interaction.options.getUser("user", true)
		if (user.bot)
			return interaction.reply(
				`${client.emotes.warn} You cannot set a bot as contact`
			)

		try {
			await client.fdgl.communities.setCommunityConfig({
				config: {
					contact: user.id,
				},
				reqConfig: {
					apikey: guildConfig.apikey,
				},
			})
			return interaction.reply(`Contact set to ${user.tag}`)
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.reply(
					`${client.emotes.warn} Your API key is not recognized by FDGL`
				)
			}
			throw e
		}
	},
}

export default ConfigSetContact
