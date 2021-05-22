const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetRulesFiltered extends Command {
	constructor(client) {
		super(client, {
			name: "getrulesfiltered",
			description: "Gets rules that this community follows",
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
		const resRaw = await fetch(`${this.client.config.apiurl}/rules/getall`)
		const rules = await resRaw.json()

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Filtered FAGC Rules")

		let sent = 0
		rules.forEach(rule => {
			if (sent == 25) {
				message.channel.send(embed)
				embed.fields = []
				sent = 0
			}
			if (config.ruleFilters.some(id => id === rule.readableid)) {
				embed.addField(rule.shortdesc, rule.readableid, true)
				sent++
			}
		})
		message.channel.send(embed)
	}
}
module.exports = GetRulesFiltered