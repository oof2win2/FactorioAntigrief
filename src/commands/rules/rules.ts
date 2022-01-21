// const { MessageEmbed } = require("discord.js")
// const Command = require("../../base/Command")
// const { createPagedEmbed } = require("../../utils/functions")

import { MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { createPagedEmbed } from "../../utils/functions";

// class GetRulesFiltered extends Command {
// 	constructor(client) {
// 		super(client, {
// 			name: "rules",
// 			description:
// 				"Gets rules that this community follows. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
// 			category: "rules",
// 			dirname: __dirname,
// 			enabled: true,
// 			memberPermissions: [],
// 			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
// 			ownerOnly: false,
// 			cooldown: 3000,
// 			requiredConfig: true,
// 		})
// 	}
// 	async run(message, _, config) {
// 		if (!config.ruleFilters || !config.ruleFilters[0])
// 			return message.reply(`${this.client.emotes.warn} No rule filters set`)

// 		let embed = new MessageEmbed()
// 			.setTitle("FAGC Rules")
// 			.setColor("GREEN")
// 			.setTimestamp()
// 			.setAuthor("FAGC Community")
// 			.setDescription(
// 				"Filtered FAGC Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
// 			)

// 		const filteredRules = await this.client.getFilteredRules(config)
// 		const fields = filteredRules
// 			.map((rule) => {
// 				return {
// 					name: `${config.ruleFilters.indexOf(rule.id)+1}) ${rule.shortdesc} (\`${rule.id}\`)`,
// 					value: rule.longdesc,
// 				}
// 			})
// 		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
// 	}
// }
// module.exports = GetRulesFiltered

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