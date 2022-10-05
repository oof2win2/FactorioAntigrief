import { Community } from "fagc-api-types"
import { AuthError } from "fagc-api-wrapper"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const RemoveCommunity = Command({
	name: "removecommunity",
	description: "Remove communities from your list of filtered communities",
	aliases: ["removecommunities"],
	usage: "[...ids]",
	examples: [
		"removecommunity XuciBx7",
		"removecommunity XuciBx7 XuciBx9 XuciBx/",
	],
	category: "communities",
	requiresRoles: true,
	requiredPermissions: ["setCommunities"],
	requiresApikey: false,
	fetchFilters: true,
	run: async ({ client, message, args, guildConfig, filters }) => {
		// you need to trust at least one external community for this command to be useful and do anything
		if (
			guildConfig.communityId &&
			filters.communityFilters === [guildConfig.communityId]
		)
			return message.channel.send(
				"You need to have at least one trusted community"
			)

		const allCommunities = await client.fagc.communities.fetchAll({})
		const currentCommunities = allCommunities.filter((c) =>
			filters.communityFilters.includes(c.id)
		)

		// if no args are provided, show the current list of trusted communities and ask for args again
		if (!args.length) {
			const embed = client
				.createBaseEmbed()
				.setTitle("FAGC Communities")
				.setDescription(
					"Remove Filtered Communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
				)
			const communityFields = await Promise.all(
				currentCommunities.map(async (community) => {
					const user = await client.users.fetch(community.contact)
					return {
						name: `${community.name} | \`${community.id}\``,
						value: `Contact: <@${user.id}> | ${user.tag}`,
						inline: false,
					}
				})
			)
			createPagedEmbed(communityFields, embed, message, {
				maxPageCount: 10,
			})
			const newIdsMessage = await client.getMessageResponse(
				message,
				`${client.emotes.type} No communities provided. Please provide IDs in a single message, separated with spaces`
			)
			if (!newIdsMessage || !newIdsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIdsMessage.content.split(" ")
		}

		// check if the communities are in the community's list of communities
		const communities = args
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
			return message.channel.send("No valid communities to be removed")

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
		createPagedEmbed(communityFields, embed, message, { maxPageCount: 5 })

		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to remove these communities from your community filters?"
		)
		if (!confirm)
			return message.channel.send("Removing communities cancelled")

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
			return message.channel.send(
				"Successfully removed community filters"
			)
		} catch (e) {
			if (e instanceof AuthError) {
				return message.channel.send(
					`${client.emotes.warn} Your API key is not recognized by FAGC`
				)
			}
			throw e
		}
	},
})

export default RemoveCommunity
