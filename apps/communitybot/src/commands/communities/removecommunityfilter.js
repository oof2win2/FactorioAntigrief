const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getConfirmationMessage } = require("../../utils/responseGetter")
const { createPagedEmbed } = require("../../utils/functions")

class AddCommunityFilter extends Command {
	constructor(client) {
		super(client, {
			name: "removecommunityfilter",
			description:
				"Removes a community filter. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			aliases: ["removecommunityfilters"],
			examples: [
				"{{p}}removecommunityfilter XuciBx7",
				"{{p}}removecommunityfilter XuciBx7 XuciBx9 XuciBx/",
			],
			category: "communities",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["setCommunities"],
		})
	}
	async run(message, args, config) {
		if (!args[0]) return message.channel.send("No communities provided")
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
		createPagedEmbed(communityFields, embed, message, { maxPageCount: 5 })

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
