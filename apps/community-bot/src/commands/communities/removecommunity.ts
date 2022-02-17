import { AuthError } from "fagc-api-wrapper"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const RemoveCommunity: Command = {
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
	run: async ({ client, message, args, guildConfig }) => {
		// you need to trust at least one external community for this command to be useful and do anything
		if (
			guildConfig.communityId &&
			guildConfig.trustedCommunities === [guildConfig.communityId]
		)
			return message.channel.send(
				"You need to have at least one trusted community"
			)
		const allCommunities = await client.fagc.communities.fetchAll({})
		const currentCommunities = allCommunities.filter((c) =>
			guildConfig.trustedCommunities.includes(c.id)
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

		// ask user if they really want to remove these communities from their filters
		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to remove these communities from your community filters?"
		)
		if (!confirm)
			return message.channel.send("Removing communities cancelled")

		// remove the communities from the config
		const communityIds = new Set([...guildConfig.trustedCommunities])
		args.forEach((id) => communityIds.delete(id))
		guildConfig.trustedCommunities = [...communityIds]
		try {
			await client.saveGuildConfig(guildConfig)
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
}
export default RemoveCommunity
