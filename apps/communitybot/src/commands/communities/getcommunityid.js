const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetID extends Command {
	constructor(client) {
		super(client, {
			name: "getcommunityid",
			description: "Gets a community by ID",
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
	async run(message, args) {
		if (!args[0]) return message.channel.send("You need to provide a community ID!")
		const community = await this.client.fagc.communities.fetchCommunity(args[0])
		if (!community) return message.channel.send(`Community with the ID \`${args[0]}\` does not exist!`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
		
		const user = await this.client.users.fetch(community.contact)
		embed.addFields(
			{
				name: `${community.name} | \`${community.id}\``,
				value: `Contact: <@${user.id}> | ${user.tag}`
			}
		)
		return message.channel.send(embed)
	}
}
module.exports = GetID