const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetAll extends Command {
	constructor(client) {
		super(client, {
			name: "getallcommunities",
			description: "Gets all communities",
			aliases: [],
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
	async run(message) {
		const rawCommunities = await fetch(`${this.client.config.apiurl}/communities/getall`)
		const communities = await rawCommunities.json()

		let communitiesEmbed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("All FAGC Communities")
		communities.forEach((community, i) => {
			if (i == 25) {
				message.channel.send(communitiesEmbed)
				communitiesEmbed.fields = []
			}
			communitiesEmbed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
		})
		message.channel.send(communitiesEmbed)
	}
}
module.exports = GetAll