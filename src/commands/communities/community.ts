import { MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"

const Community: Command = {
	name: "community",
	description: "Gets a community by ID",
	aliases: [],
	usage: "(id)",
	examples: [],
	category: "communities",
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ client, message, args }) => {
		const communityId = await client.argsOrInput(args, message, `${client.emotes.type} Provide a community ID to fetch`)
		if (!communityId)
			return message.channel.send(
				`${client.emotes.warn} No community ID was provided`,
			)
		const community = await client.fagc.communities.fetchCommunity({
			communityId: communityId,
		})
		if (!community)
			return message.channel.send(
				`${client.emotes.warn} Community with the ID \`${communityId}\` does not exist!`,
			)

		const embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({ name: client.config.embeds.author })
			.setFooter({ text: client.config.embeds.footer })

		embed.addFields({
			name: `${community.name} | \`${community.id}\``,
			value: await client.safeGetContactString(community.contact),
		})
		return message.channel.send({
			embeds: [embed],
		})
	},
}

export default Community
