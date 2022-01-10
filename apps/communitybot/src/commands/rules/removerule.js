const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getConfirmationMessage, getMessageResponse } = require("../../utils/responseGetter")
const { createPagedEmbed } = require("../../utils/functions")

class RemoveRuleFilter extends Command {
	constructor(client) {
		super(client, {
			name: "removerule",
			description:
				"Removes a rule filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md). Get IDs with fagc!allrules",
			aliases: [ "removerules" ],
			usage: "[...ids]",
			examples: [
				"{{p}}removerule XuciBx7",
				"{{p}}removerule XuciBx7 XuciBx9 XuciBx/",
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
			const rules = await this.client.fagc.rules.fetchAll({})

			let embed = new MessageEmbed()
				.setTitle("FAGC Rules")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor("FAGC Community")
				.setDescription("All FAGC Rules")
			let fields = []
			for (let i = 0; i < rules.length; i += 5) {
				fields.push({
					name: rules
						.slice(i, i + 5)
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
			args.map((ruleid) => this.client.fagc.rules.fetchRule({ ruleid: ruleid }))
		)

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				"Remove Filtered Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)
		const rules = args
			.map((ruleid) => this.client.fagc.rules.resolveID(ruleid))
			.filter((r) => r)
			.filter((r) => config.ruleFilters.includes(r.id))

		if (!rules.length)
			return message.channel.send("No valid rules to be removed")

		const ruleFields = rules.map((rule) => {
			return {
				name: `${rule.shortdesc} (\`${rule.id}\`)`,
				value: rule.longdesc,
			}
		})
		createPagedEmbed(ruleFields, embed, message, { maxPageCount: 5 })

		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want to remove these rules from your rule filters?"
		)
		if (!confirm) return message.channel.send("Removing rules cancelled")

		const ruleIDs = rules.map((rule) => rule.id)
		config.ruleFilters = config.ruleFilters.filter(
			(ruleFilter) => !ruleIDs.includes(ruleFilter)
		)

		await this.client.saveGuildConfig(config)
		return message.channel.send("Successfully removed filtered rules")
	}
}
module.exports = RemoveRuleFilter
