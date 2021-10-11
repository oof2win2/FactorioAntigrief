const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetIDRule extends Command {
	constructor(client) {
		super(client, {
			name: "rule",
			description: "Gets a rule by its ID",
			usage: "[ruleID]",
			examples: ["{{p}}rule XuciBx7"],
			category: "rules",
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
		if (!args[0]) return message.reply("Provide rule ID to fetch")
		const rule = await this.client.fagc.rules.fetchRule(args[0])

		if (rule === null)
			return message.reply(`No rule with ID of \`${args[0]}\` exists`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Rule with ID \`${rule.id}\``)
		embed.addField(rule.shortdesc, rule.longdesc)
		return message.channel.send(embed)
	}
}
module.exports = GetIDRule
