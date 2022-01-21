import { MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { createPagedEmbed } from "../../utils/functions";

const Rules: Command = {
	name: "rules",
	description: "Gets rules that this community follows. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
	category: "rules",
	usage: "",
	examples: [],
	aliases: [],
	requiresRoles: false,
	requiresApikey: false,
	run: async ({client, message, guildConfig}) => {
		// if there are no filtered rules, it makes no sense proceeding
		if (!guildConfig.ruleFilters.length)
			return message.reply(`${client.emotes.warn} No rule filters set`)

		const allRules = await client.fagc.rules.fetchAll({})
		const filteredRules = allRules
			.filter(rule => guildConfig.ruleFilters.includes(rule.id))

		const embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({name: client.config.embeds.author})
			.setFooter({text: client.config.embeds.footer})
			.setDescription("Filtered FAGC Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)")
		// create the fields
		const fields = filteredRules
			.map((rule) => {
				return {
					name: `${guildConfig.ruleFilters.indexOf(rule.id)+1}) ${rule.shortdesc} (\`${rule.id}\`)`,
					value: rule.longdesc,
					inline: false
				}
			}
		)
		// create the embed
		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
	}
}

export default Rules