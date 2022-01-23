import { MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import {
	getConfirmationMessage,
	getMessageResponse,
} from "../../utils/responseGetter"

const RemoveCommunity: Command = {
	name: "removecommunity",
	description: "Remove communities from your list of filtered communities",
	aliases: ["removecommunities"],
	usage: "[...ids]",
	examples: [
		"{{p}}removecommunity XuciBx7",
		"{{p}}removecommunity XuciBx7 XuciBx9 XuciBx/",
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
				"You need to have at least one trusted community",
			)
		const allCommunities = await client.fagc.communities.fetchAll({})
		const currentCommunities = allCommunities.filter((c) =>
			guildConfig.trustedCommunities.includes(c.id),
		)

		// if no args are provided, show the current list of trusted communities and ask for args again
		if (!args.length) {
			const embed = new MessageEmbed()
				.setTitle("FAGC Communities")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor({ name: client.config.embeds.author })
				.setFooter({ text: client.config.embeds.footer })
				.setDescription(
					"Remove Filtered Communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
				)
			const communityFields = await Promise.all(
				currentCommunities.map(async (community) => {
					const user = await client.users.fetch(community.contact)
					return {
						name: `${community.name} | \`${community.id}\``,
						value: `Contact: <@${user.id}> | ${user.tag}`,
						inline: false,
					}
				}),
			)
			createPagedEmbed(communityFields, embed, message, { maxPageCount: 10 })
			const newIDsMessage = await getMessageResponse(
				message,
				":keyboard: No communities provided. Please provide IDs in a single message, separated with spaces:",
			)
			if (!newIDsMessage || !newIDsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIDsMessage.content.split(" ")
		}

		// ask user if they really want to remove these communities from their filters
		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want to remove these communities from your community filters?",
		)
		if (!confirm) return message.channel.send("Removing communities cancelled")

		// remove the communities from the config
		const communityIds = new Set([...guildConfig.trustedCommunities])
		args.forEach((id) => communityIds.delete(id))
		guildConfig.trustedCommunities = [...communityIds]
		await client.saveGuildConfig(guildConfig)
		return message.channel.send("Successfully removed community filters")
	},
}
export default RemoveCommunity
