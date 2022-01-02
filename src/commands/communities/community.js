const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getMessageResponse } = require("../../utils/responseGetter")

class GetID extends Command {
	constructor(client) {
		super(client, {
			name: "community",
			description: "Gets a community by ID",
			usage: "[id]",
			category: "communities",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message, args) {
		if (!args[0])
			args[0] = await getMessageResponse(message, `${this.client.emotes.type} Provide a community ID to fetch`)
				.then((r) => r?.content?.split(" ")[0])
		args = args.map(x => x.toLowerCase())
		const communityId = args.shift()
		if (!communityId) return message.channel.send(`${this.client.emotes.warn} No community ID was provided`)
		const community = await this.client.fagc.communities.fetchCommunity({ communityID: communityId })
		if (!community)
			return message.channel.send(`${this.client.emotes.warn} Community with the ID \`${communityId}\` does not exist!`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")

		const user = await this.client.users.fetch(community.contact)
		embed.addFields({
			name: `${community.name} | \`${community.id}\``,
			value: `Contact: <@${user.id}> | ${user.tag}`,
		})
		return message.channel.send(embed)
	}
}
module.exports = GetID
