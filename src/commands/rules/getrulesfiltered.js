const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetRulesFiltered extends Command {
	constructor(client) {
		super(client, {
			name: "getrulesfiltered",
			description: "Gets rules that this community follows. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			aliases: ["getfilteredrules", "getrules"],
			category: "rules",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
		})
	}
	async run(message, _, config) {
		if (!config.ruleFilters || !config.ruleFilters[0])
			return message.reply("No rule filters set")

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Filtered FAGC Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)")


		const filteredRules = await this.client.getFilteredRules(config)
		const fields = filteredRules.map(rule => {
			return {
				name: `${rule.shortdesc} (\`${rule.id}\`)`,
				value: rule.longdesc,
			}
		})
		createPagedEmbed(fields, embed, message, {maxPageCount: 5})
	}
}
module.exports = GetRulesFiltered