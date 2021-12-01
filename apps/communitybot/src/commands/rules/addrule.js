const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getConfirmationMessage, getMessageResponse } = require("../../utils/responseGetter")
const { createPagedEmbed } = require("../../utils/functions")

class AddRuleFilter extends Command {
	constructor(client) {
		super(client, {
			name: "addrule",
			description:
				"Adds a rule filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md). Get IDs with fagc!allrules",
			aliases: [ "addrules" ],
			usage: "[...ids]",
			examples: [
				"{{p}}addrule XuciBx7",
				"{{p}}addrule XuciBx7 XuciBx9 XuciBx/",
			],
			category: "rules",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [ "ADMINISTRATOR" ],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: [ "setRules" ],
		})
	}
	async run(message, args, config) {
		if (!args[0]) {
			const rules = await this.client.fagc.rules.fetchAll()

			let embed = new MessageEmbed()
				.setTitle("FAGC Rules")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor("FAGC Community")
				.setDescription("All FAGC Rules")
			let fields = []
			for (let i = 0; i < rules.length; i += 10) {
				fields.push({
					name: rules
						.slice(i, i + 10)
						.map((rule) => `${rule.shortdesc} (\`${rule.id}\`)\n`)
						.join(""),
					value: "\u200b",
				})
			}
			createPagedEmbed(fields, embed, message, { maxPageCount: 1 })
			const newIDsMessage = await getMessageResponse(
				message,
				`${this.client.emotes.type} No rules provided. Please provide IDs`
			)

			if (!newIDsMessage || !newIDsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIDsMessage.content.split(" ")
		}

		await Promise.all(
			args.map((ruleid) => this.client.fagc.rules.fetchRule(ruleid))
		)

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				"Add Filtered Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)
		const rules = args
			.map((ruleid) => this.client.fagc.rules.resolveID(ruleid))
			.filter((r) => r)
			.filter((r) => !config.ruleFilters.includes(r.id))

		if (!rules.length)
			return message.channel.send(
				"No valid or non-duplicate rules to be added"
			)

		const ruleFields = rules.map((rule) => {
			return {
				name: `${rule.shortdesc} (\`${rule.id}\`)`,
				value: rule.longdesc,
			}
		})
		createPagedEmbed(ruleFields, embed, message, { maxPageCount: 5 })

		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want to add these rules to your rule filters?"
		)
		if (!confirm) return message.channel.send("Adding rules cancelled")
		rules.forEach((rule) => {
			config.ruleFilters.push(rule.id)
		})
		await this.client.saveGuildConfig(config)
		return message.channel.send("Successfully added filtered rules")
	}
}
module.exports = AddRuleFilter
