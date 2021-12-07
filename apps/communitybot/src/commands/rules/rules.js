const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetRulesFiltered extends Command {
	constructor(client) {
		super(client, {
			name: "rules",
			description:
				"Gets rules that this community follows. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			category: "rules",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
		})
	}
	async run(message, _, config) {
		if (!config.ruleFilters || !config.ruleFilters[0])
			return message.reply(`${this.client.emotes.warn} No rule filters set`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				"Filtered FAGC Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)

		const filteredRules = await this.client.getFilteredRules(config)
		const fields = filteredRules
			.sort((a, b) => config.ruleFilters.indexOf(a.id) - config.ruleFilters.indexOf(b.id))
			.map((rule) => {
				return {
					name: `${config.ruleFilters.indexOf(rule.id)+1}) ${rule.shortdesc} (\`${rule.id}\`)`,
					value: rule.longdesc,
				}
			})
		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
	}
}
module.exports = GetRulesFiltered
