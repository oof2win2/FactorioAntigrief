import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

const CommunitiesDetails: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("details")
		.setDescription("View details of a community")
		.addStringOption(
			(option) =>
				option
					.setName("community")
					.setDescription("The community to view")
					.setRequired(true)
			// TODO implement autocomplete
			// .setAutocomplete(true)
		),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client }) => {
		const communityId = interaction.options.getString("community", true)

		const community = await client.fagc.communities.fetchCommunity({
			communityId: communityId,
		})

		if (!community)
			return interaction.reply(
				`${client.emotes.warn} Community with the ID \`${communityId}\` does not exist!`
			)

		const embed = client.createBaseEmbed().setTitle("FAGC Communities")

		embed.addFields({
			name: `${community.name} | \`${community.id}\``,
			value: await client.safeGetContactString(community.contact),
		})
		return interaction.reply({
			embeds: [embed],
		})
	},
}

export default CommunitiesDetails
