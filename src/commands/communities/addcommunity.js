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
			name: "addcommunity",
			description:
				"Adds a community filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md). . Get IDs with fagc!allcommunities",
			usage: "[...ids]",
			aliases: [ "addcommunities" ],
			examples: [
				"{{p}}addcommunity XuciBx7",
				"{{p}}addcommunity XuciBx7 XuciBx9 XuciBx/",
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
					.filter((r) => !config.trustedCommunities.includes(r.id))
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
			createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
			const newIDsMessage = await getMessageResponse(
				message,
				`${this.client.emotes.type} No communities provided. Please provide IDs in a single message, separated with spaces:`
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
				"Add Filtered Communities. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md). Get IDs with fagc!allcommunities"
			)
		const communities = args
			.map((communityid) =>
				this.client.fagc.communities.resolveID(communityid)
			)
			.filter((r) => r)
			.filter((r) => !config.trustedCommunities.includes(r.id))

		if (!communities.length)
			return message.channel.send(
				"No valid or non-duplicate communities to be added"
			)

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
			"Are you sure you want to add these communities to your communities filters?"
		)
		if (!confirm)
			return message.channel.send("Adding communities cancelled")
		communities.forEach((community) => {
			config.trustedCommunities.push(community.id)
		})
		await this.client.saveGuildConfig(config)
		return message.channel.send("Successfully added community filters")
	}
}
module.exports = AddCommunityFilter
