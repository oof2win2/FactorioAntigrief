import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Formatters } from "discord.js"
import { SubCommand } from "../../base/Command"

const ConfigView: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("View your guild config"),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client, guildConfig }) => {
		const embed = client
			.createBaseEmbed()
			.setTitle("FDGL Config")
			.setDescription("Your FDGL Configuration")

		const community = guildConfig.communityId
			? await client.fdgl.communities.fetchCommunity({
					communityId: guildConfig.communityId,
			  })
			: null

		embed.addFields(
			{
				name: "Community name",
				value: community ? community.name : "Community does not exist",
				inline: true,
			},
			{
				name: "Community contact",
				value: community
					? `${Formatters.userMention(community.contact)}> | ${
							community.contact
					  }`
					: "Community does not exist",
				inline: true,
			},
			{
				name: "API key",
				value: guildConfig.apikey ? "Set" : "None",
				inline: true,
			},
			{
				name: "Report management",
				value: guildConfig.roles.reports
					? `${Formatters.roleMention(
							guildConfig.roles.reports
					  )}> | ${guildConfig.roles.reports}`
					: "No role",
				inline: true,
			},
			{
				name: "Webhook management",
				value: guildConfig.roles.webhooks
					? `${Formatters.roleMention(
							guildConfig.roles.webhooks
					  )} | ${guildConfig.roles.webhooks}`
					: "No role",
				inline: true,
			},
			{
				name: "Config management",
				value: guildConfig.roles.setConfig
					? `${Formatters.roleMention(
							guildConfig.roles.setConfig
					  )} | ${guildConfig.roles.setConfig}`
					: "No role",
				inline: true,
			},
			{
				name: "Category filter management",
				value: guildConfig.roles.setCategories
					? `${Formatters.roleMention(
							guildConfig.roles.setCategories
					  )} | ${guildConfig.roles.setCategories}`
					: "No role",
				inline: true,
			},
			{
				name: "Trusted communities management",
				value: guildConfig.roles.setCommunities
					? `${Formatters.roleMention(
							guildConfig.roles.setCommunities
					  )} | ${guildConfig.roles.setCommunities}`
					: "No role",
				inline: true,
			}
		)

		return interaction.reply({
			embeds: [embed],
		})
	},
}

export default ConfigView
