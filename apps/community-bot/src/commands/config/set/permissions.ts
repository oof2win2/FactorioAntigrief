import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { AuthError } from "fagc-api-wrapper"
import { SubCommand } from "../../../base/Command"

const ConfigSetPermissions: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("permissions")
		.setDescription("Set the permissions for a role")
		.addStringOption((option) =>
			option
				.setName("permission")
				.setDescription("Which permission to set")
				.setRequired(true)
				.addChoices(
					{
						name: "Reports",
						value: "reports",
					},
					{
						name: "Webhooks",
						value: "webhooks",
					},
					{
						name: "Set Config",
						value: "setConfig",
					},
					{
						name: "Set Categories",
						value: "setCategories",
					},
					{
						name: "Set Communities",
						value: "setCommunities",
					}
				)
		)
		.addRoleOption((option) =>
			option
				.setName("role")
				.setDescription("Role to set the permission for")
				.setRequired(true)
		),
	requiredPermissions: ["setConfig"],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client }) => {
		const permission = interaction.options.getString("permission", true)
		const role = interaction.options.getRole("role", true)

		const confirmation = await client.getConfirmation(
			interaction,
			`Are you sure you want to set the ${permission} permission to ${role.name}?`,
			interaction.user
		)
		if (!confirmation)
			return interaction.followUp("Role configuration cancelled")

		try {
			await client.saveGuildConfig({
				guildId: interaction.guild.id,
				// this works but just needs to have the right types, maybe a SetGuildConfig type from fagc-api-types
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				roles: {
					[permission]: role.id,
				},
			})
			return interaction.followUp(
				`${client.emotes.success} Successfully set the ${permission} permission to ${role.name}!`
			)
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.followUp(
					`${client.emotes.warn} Your API key is not recognized by FAGC`
				)
			}
			throw e
		}
	},
}

export default ConfigSetPermissions
