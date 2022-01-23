import { MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const Communities: Command = {
	name: "communities",
	description:
		"Gets trusted communities. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
	aliases: [],
	usage: "",
	examples: [],
	category: "communities",
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ client, message, guildConfig }) => {
		const embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({ name: client.config.embeds.author })
			.setFooter({ text: client.config.embeds.footer })
			.setDescription(
				"Trusted FAGC Communities [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			)

		const allCommunities = await client.fagc.communities.fetchAll({})
		const filteredCommunities = allCommunities.filter((community) =>
			guildConfig.trustedCommunities.includes(community.id),
		)
		const fields = await Promise.all(
			filteredCommunities.map(async (community) => {
				const user = await client.users.fetch(community.contact)
				return {
					name: `${community.name} | \`${community.id}\``,
					value: `Contact: <@${user.id}> | ${user.tag}`,
					inline: false,
				}
			}),
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
	},
}

export default Communities
