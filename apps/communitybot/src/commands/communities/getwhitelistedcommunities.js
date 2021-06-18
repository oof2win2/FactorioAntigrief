const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetWhitelisted extends Command {
	constructor(client) {
		super(client, {
			name: "gettrustedcommunities",
			description: "Gets trusted communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			aliases: ["getwhitelistedcommunities", "getfilteredcommunities", "getcommunities", "gettrusted"],
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
		const communities = await this.client.fagc.communities.fetchAll()
		const config = await this.client.fagc.communities.fetchConfig(message.guild.id)

		let communitiesEmbed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Trusted FAGC Communities [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)")

		let sent = 0
		await Promise.all(communities.map(async (community) => {
			if (sent == 25) {
				message.channel.send(communitiesEmbed)
				communitiesEmbed.fields = []
			}
			if (config.trustedCommunities.some(id => id === community.id)) {
				const user = await this.client.users.fetch(community.contact)
				communitiesEmbed.addField(`${community.name} | ${community.id}`, `Contact: <@${user.id}> | ${user.tag}`)
				sent++
			}
		}))
		message.channel.send(communitiesEmbed)
	}
}

module.exports = GetWhitelisted