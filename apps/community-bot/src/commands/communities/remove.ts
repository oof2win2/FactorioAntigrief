import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { AuthError } from "fagc-api-wrapper"
import { Community } from "fagc-api-types"
import { createPagedEmbed } from "../../utils/functions"

const slashCommand = new SlashCommandSubcommandBuilder()
	.setName("remove")
	.setDescription("Remove communities from your list of filtered communities")
	.addStringOption(
		(option) =>
			option
				.setName("community")
				.setDescription("The community to remove")
				.setRequired(true)
		// .setAutocomplete(true) // TODO implement autocomplete
	)

// Add 9 more community arguments
new Array(9).fill(0).forEach((_, i) => {
	slashCommand.addStringOption((option) =>
		option
			.setName(`community${i + 2}`)
			.setDescription(`The community to remove`)
			.setRequired(false)
	)
})

const CommunitiesRemove: SubCommand<false, true> = {
	type: "SubCommand",
	data: slashCommand,
	requiredPermissions: ["setCategories"],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters, guildConfig }) => {
		// you need to trust at least one external community for this command to be useful and do anything
		if (
			guildConfig.communityId &&
			filters.communityFilters === [guildConfig.communityId]
		)
			return interaction.reply(
				// TODO replace this with a command mention
				"You need to have at least one trusted community. Add one with `/communities add`"
			)

		const argCategories =
			interaction.options.data[0].options?.map(
				(option) => option.value as string
			) ?? []

		// check if the communities are in the community's list of communities
		const communities = argCategories
			.map((communityId) =>
				isNaN(Number(communityId))
					? client.fagc.communities.resolveId(communityId)
					: // if it is an index in filtered communities, it needs to be resolved
					  client.fagc.communities.resolveId(
							filters.categoryFilters[Number(communityId) - 1]
					  )
			)
			.filter((r): r is Community => Boolean(r))
			.filter((r) => filters.communityFilters.includes(r.id))

		// if there are no communities that are already in the community's filters, then exit
		if (!communities.length)
			return interaction.reply("No valid communities to be removed")

		// otherwise, send a paged embed with the communities to be removed and ask for confirmation
		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Communities")
			.setDescription(
				"Remove Filtered Communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)

		const communityFields = await Promise.all(
			communities.map(async (community) => {
				const user = await client.users.fetch(community.contact)

				return {
					name: `${community.name} | \`${community.id}\``,
					value: `Contact: <@${user.id}> | ${user.tag}`,
					inline: false,
				}
			})
		)

		const message = await interaction.reply({
			embeds: [embed],
			fetchReply: true,
		})

		createPagedEmbed(communityFields, embed, message, {
			maxPageCount: 5,
			user: interaction.user,
		})

		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to remove these communities from your community filters?",
			{
				user: interaction.user,
			}
		)
		if (!confirm)
			return interaction.followUp("Removing communities cancelled")

		// remove the communities from the community's filters
		const categoryIds = communities.map((community) => community.id)
		const newCommunityFilters = filters.categoryFilters.filter(
			(communityFilter) => !categoryIds.includes(communityFilter)
		)

		try {
			await client.saveFilters(
				{
					id: filters.id,
					communityFilters: newCommunityFilters,
				},
				guildConfig.communityId ?? null
			)
			return interaction.followUp(
				"Successfully removed community filters"
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

export default CommunitiesRemove
