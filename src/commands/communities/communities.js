const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetWhitelisted extends Command {
	constructor(client) {
		super(client, {
			name: "communities",
			description:
				"Gets trusted communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			category: "communities",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message, _, config) {
		const communities = await this.client.fagc.communities.fetchAll()

		let embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				"Trusted FAGC Communities [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)

		const filteredCommunities = communities.filter((community) =>
			config.trustedCommunities?.includes(community.id)
		)
		const fields = await Promise.all(
			filteredCommunities.map(async (community) => {
				const user = await this.client.users.fetch(community.contact)
				return {
					name: `${community.name} | \`${community.id}\``,
					value: `Contact: <@${user.id}> | ${user.tag}`,
				}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	}
}

module.exports = GetWhitelisted
