import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { createPagedEmbed } from "../../utils/functions"

const CommunitiesView: SubCommand<false, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("Gets trusted communities"),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters }) => {
		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Communities")
			.setDescription(
				"Trusted FAGC Communities [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)

		const allCommunities = await client.fagc.communities.fetchAll({})
		const filteredCommunities = allCommunities.filter((community) =>
			filters.communityFilters.includes(community.id)
		)
		const fields = await Promise.all(
			filteredCommunities.map(async (community) => {
				const user = await client.users.fetch(community.contact)
				return {
					name: `${community.name} | \`${community.id}\``,
					value: `Contact: <@${user.id}> | ${user.tag}`,
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

export default CommunitiesView
