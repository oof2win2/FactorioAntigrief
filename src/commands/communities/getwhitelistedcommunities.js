const fetch = require("node-fetch")
const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetWhitelisted extends Command {
	constructor(client) {
		super(client, {
			name: "getfilteredcommunities",
			description: "Gets trusted communities",
			aliases: ["getwhitelistedcommunities", "gettrustedcommunities", "getcommunities", "gettrusted"],
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
		const config = await ConfigModel.findOne({ guildid: message.guild.id })

		let communitiesEmbed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Trusted FAGC Communities")

		let sent = 0
		communities.forEach((community) => {
			if (sent == 25) {
				message.channel.send(communitiesEmbed)
				communitiesEmbed.fields = []
			}
			if (config.trustedCommunities.some(id => id === community._id)) {
				communitiesEmbed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
				sent++
			}
		})
		message.channel.send(communitiesEmbed)
	}
}

module.exports = GetWhitelisted