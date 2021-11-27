const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getMessageResponse } = require("../../utils/responseGetter")

class GetIDRule extends Command {
	constructor(client) {
		super(client, {
			name: "rule",
			description: "Gets a rule by its ID",
			usage: "[ruleID]",
			examples: [ "{{p}}rule XuciBx7" ],
			category: "rules",
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
			args[0] = await getMessageResponse(message, `${this.client.emotes.type} Provide a rule ID to fetch`)
				.then((r) => r?.content)
		const ruleID = args.shift()
		if (!ruleID) return message.channel.send(`${this.client.emotes.warn} No rule ID was provided`)
		const rule = await this.client.fagc.rules.fetchRule(ruleID)

		if (rule === null)
			return message.reply(`${this.client.emotes.warn} No rule with ID of \`${ruleID}\` exists`)

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
