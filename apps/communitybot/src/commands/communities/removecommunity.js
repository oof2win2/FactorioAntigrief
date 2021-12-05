const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const {
	getConfirmationMessage,
	getMessageResponse,
} = require("../../utils/responseGetter")
const { createPagedEmbed } = require("../../utils/functions")

class AddCommunityFilter extends Command {
	constructor(client) {
		super(client, {
			name: "removecommunity",
			description:
				"Removes a community filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md). Get IDs with fagc!allcommunities",
			aliases: [ "removecommunities" ],
			usage: "[...ids]",
			examples: [
				"{{p}}removecommunity XuciBx7",
				"{{p}}removecommunity XuciBx7 XuciBx9 XuciBx/",
			],
			category: "communities",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [ "ADMINISTRATOR" ],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: [ "setCommunities" ],
		})
	}
	async run(message, args, config) {
		if (!config.trustedCommunities?.length)
			return message.channel.send("You have not set any trusted communities")
		if (!args[0]) {
			const communities = await this.client.fagc.communities.fetchAll()
			let embed = new MessageEmbed()
				.setTitle("FAGC Communities")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor("FAGC Community")
				.setDescription("All FAGC Communities")
			const fields = await Promise.all(
				communities
					.filter((r) => config.trustedCommunities.includes(r.id))
					.map(async (community) => {
						const user = await this.client.users.fetch(
							community.contact
						)
						return {
							name: `${community.name} | \`${community.id}\``,
							value: `Contact: <@${user.id}> | ${user.tag}`,
						}
					})
			)
			createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
			const newIDsMessage = await getMessageResponse(
				message,
				":keyboard: No communities provided. Please provide IDs in a single message, separated with spaces:"
			)
			if (!newIDsMessage || !newIDsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIDsMessage.content.split(" ")
		}

		await Promise.all(
			args.map((communityid) =>
				this.client.fagc.communities.fetchCommunity(communityid)
			)
		)

		let embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				"Remove Filtered Communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)
		const communities = args
			.map((communityid) =>
				this.client.fagc.communities.resolveID(communityid)
			)
			.filter((r) => r)
			.filter((r) => config.trustedCommunities.includes(r.id))

		if (!communities.length)
			return message.channel.send("No valid communities to be removed")

		const communityFields = await Promise.all(
			communities.map(async (community) => {
				const user = await this.client.users.fetch(community.contact)
				return {
					name: `${community.name} | \`${community.id}\``,
					value: `Contact: <@${user.id}> | ${user.tag}`,
				}
			})
		)
		createPagedEmbed(communityFields, embed, message, { maxPageCount: 25 })

		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want to remove these communities from your communities filters?"
		)
		if (!confirm)
			return message.channel.send("Removing communities cancelled")

		const communityIDs = communities.map((c) => c.id)
		config.trustedCommunities = config.trustedCommunities.filter(
			(c) => !communityIDs.includes(c)
		)
		await this.client.saveGuildConfig(config)
		return message.channel.send("Successfully removed community filters")
	}
}
module.exports = AddCommunityFilter
