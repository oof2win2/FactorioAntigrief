// const { MessageEmbed } = require("discord.js")
// const Command = require("../../base/Command")
// const {
// 	getConfirmationMessage,
// 	getMessageResponse,
// } = require("../../utils/responseGetter")
// const { createPagedEmbed } = require("../../utils/functions")

import { MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { createPagedEmbed } from "../../utils/functions";
import { getConfirmationMessage, getMessageResponse } from "../../utils/responseGetter";

// class AddCommunityFilter extends Command {
// 	constructor(client) {
// 		super(client, {
// 			name: "removecommunity",
// 			description:
// 				"Removes a community filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md). Get IDs with fagc!allcommunities",
// 			aliases: [ "removecommunities" ],
// 			usage: "[...ids]",
// 			examples: [
// 				"{{p}}removecommunity XuciBx7",
// 				"{{p}}removecommunity XuciBx7 XuciBx9 XuciBx/",
// 			],
// 			category: "communities",
// 			dirname: __dirname,
// 			enabled: true,
// 			memberPermissions: [ "ADMINISTRATOR" ],
// 			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
// 			ownerOnly: false,
// 			cooldown: 3000,
// 			requiredConfig: true,
// 			customPermissions: [ "setCommunities" ],
// 		})
// 	}
// 	async run(message, args, config) {
// 		if (!config.trustedCommunities?.length)
// 			return message.channel.send("You have not set any trusted communities")
// 		if (!args[0]) {
// 			const communities = await this.client.fagc.communities.fetchAll({})
// 			let embed = new MessageEmbed()
// 				.setTitle("FAGC Communities")
// 				.setColor("GREEN")
// 				.setTimestamp()
// 				.setAuthor("FAGC Community")
// 				.setDescription("All FAGC Communities")
// 			const fields = await Promise.all(
// 				communities
// 					.filter((r) => config.trustedCommunities.includes(r.id))
// 					.map(async (community) => {
// 						const user = await this.client.users.fetch(
// 							community.contact
// 						)
// 						return {
// 							name: `${community.name} | \`${community.id}\``,
// 							value: `Contact: <@${user.id}> | ${user.tag}`,
// 						}
// 					})
// 			)
// 			createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
// 			const newIDsMessage = await getMessageResponse(
// 				message,
// 				":keyboard: No communities provided. Please provide IDs in a single message, separated with spaces:"
// 			)
// 			if (!newIDsMessage || !newIDsMessage.content)
// 				return message.channel.send("No IDs were provided")
// 			args = newIDsMessage.content.split(" ")
// 		}

// 		args = args.map(x => x.toLowerCase())

// 		// fetch the communities into the cache so they can be retrieved later
// 		await Promise.all(
// 			args.map((communityID) =>
// 				this.client.fagc.communities.fetchCommunity({ communityID: communityID })
// 			)
// 		)

// 		let embed = new MessageEmbed()
// 			.setTitle("FAGC Communities")
// 			.setColor("GREEN")
// 			.setTimestamp()
// 			.setAuthor("FAGC Community")
// 			.setDescription(
// 				"Remove Filtered Communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
// 			)
// 		const communities = args
// 			.map((communityid) =>
// 				this.client.fagc.communities.resolveID(communityid)
// 			)
// 			.filter((r) => r)
// 			.filter((r) => config.trustedCommunities.includes(r.id))

// 		if (!communities.length)
// 			return message.channel.send("No valid communities to be removed")

// 		const communityFields = await Promise.all(
// 			communities.map(async (community) => {
// 				const user = await this.client.users.fetch(community.contact)
// 				return {
// 					name: `${community.name} | \`${community.id}\``,
// 					value: `Contact: <@${user.id}> | ${user.tag}`,
// 				}
// 			})
// 		)
// 		createPagedEmbed(communityFields, embed, message, { maxPageCount: 10 })

// 		const confirm = await getConfirmationMessage(
// 			message,
// 			"Are you sure you want to remove these communities from your communities filters?"
// 		)
// 		if (!confirm)
// 			return message.channel.send("Removing communities cancelled")

// 		const communityIDs = communities.map((c) => c.id)
// 		config.trustedCommunities = config.trustedCommunities.filter(
// 			(c) => !communityIDs.includes(c)
// 		)
// 		await this.client.saveGuildConfig(config)
// 		return message.channel.send("Successfully removed community filters")
// 	}
// }
// module.exports = AddCommunityFilter


const RemoveCommunity: Command = {
	name: "removecommunity",
	description: "Remove communities from your list of filtered communities",
	aliases: [ "removecommunities" ],
	usage: "[...ids]",
	examples: [
		"{{p}}removecommunity XuciBx7",
		"{{p}}removecommunity XuciBx7 XuciBx9 XuciBx/",
	],
	category: "communities",
	requiresRoles: true,
	requiredPermissions: ["setCommunities"],
	requiresApikey: false,
	run: async ({client, message, args, guildConfig}) => {
		// you need to trust at least one external community for this command to be useful and do anything
		if (guildConfig.communityId && guildConfig.trustedCommunities === [guildConfig.communityId]) return message.channel.send("You need to have at least one trusted community")
		const allCommunities = await client.fagc.communities.fetchAll({})
		const currentCommunities = allCommunities.filter(c => guildConfig.trustedCommunities.includes(c.id))
		
		// if no args are provided, show the current list of trusted communities and ask for args again
		if (!args.length) {
			let embed = new MessageEmbed()
				.setTitle("FAGC Communities")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor({name: client.config.embeds.author})
				.setFooter({text: client.config.embeds.footer})
				.setDescription("Remove Filtered Communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)")
			const communityFields = await Promise.all(
				currentCommunities.map(async (community) => {
					const user = await client.users.fetch(community.contact)
					return {
						name: `${community.name} | \`${community.id}\``,
						value: `Contact: <@${user.id}> | ${user.tag}`,
						inline: false
					}
				})
			)
			createPagedEmbed(communityFields, embed, message, { maxPageCount: 10 })
			const newIDsMessage = await getMessageResponse(
				message,
				":keyboard: No communities provided. Please provide IDs in a single message, separated with spaces:"
			)
			if (!newIDsMessage || !newIDsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIDsMessage.content.split(" ")
		}

		// ask user if they really want to remove these communities from their filters
		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want to remove these communities from your community filters?"
		)
		if (!confirm) return message.channel.send("Removing communities cancelled")

		// remove the communities from the config
		const communityIds = new Set([...guildConfig.trustedCommunities])
		args.forEach(id => communityIds.delete(id))
		guildConfig.trustedCommunities = [...communityIds]
		await client.saveGuildConfig(guildConfig)
		return message.channel.send("Successfully removed community filters")
	}
}
export default RemoveCommunity