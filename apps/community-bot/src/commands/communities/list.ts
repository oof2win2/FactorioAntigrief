import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { createPagedEmbed } from "../../utils/functions"

const CommunitiesList: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("Gets all communities"),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client }) => {
		const communities = await client.fagc.communities.fetchAll({})

		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Communities")
			.setDescription("All FAGC Communities")

		const fields = await Promise.all(
			communities.map(async (community) => {
				return {
					name: `${community.name} | \`${community.id}\``,
					value: await client.safeGetContactString(community.contact),
					inline: false,
				}
			})
		)

		// create the embed
		createPagedEmbed(fields, embed, interaction, interaction.user, {
			maxPageCount: 10,
		})
	},
}

export default CommunitiesList
