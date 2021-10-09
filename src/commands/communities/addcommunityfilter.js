const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getConfirmationMessage } = require("../../utils/responseGetter")
const { createPagedEmbed } = require("../../utils/functions")

class AddCommunityFilter extends Command {
	constructor(client) {
		super(client, {
			name: "addcommunityfilter",
			description:
				"Adds a community filter. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			aliases: ["addcommunityfilters"],
			examples: [
				"{{p}}addrulefilter XuciBx7",
				"{{p}}addrulefilter XuciBx7 XuciBx9 XuciBx/",
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
				"Add Filtered Communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)
		const communities = args
			.map((ruleid) => this.client.fagc.communities.resolveID(ruleid))
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
		createPagedEmbed(communityFields, embed, message, { maxPageCount: 5 })

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
