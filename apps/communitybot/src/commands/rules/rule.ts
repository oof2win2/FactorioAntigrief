import { Command } from "../../base/Command"

const Rule: Command = {
	name: "rule",
	aliases: [],
	description: "Gets a rule by its ID or index in filtered rules",
	category: "rules",
	usage: "[ruleID|index]",
	examples: ["rule XuciBx7", "rule 1"],
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ client, message, args, guildConfig }) => {
		// if the person did not provide an argument, get a message response
		const ruleID = await client.argsOrInput(args, message, `${client.emotes.type} Provide a rule ID or index  to fetch`)
		if (!ruleID)
			return message.channel.send(
				`${client.emotes.warn} No rule ID or index was provided`,
			)
		const rule = Number(ruleID)
			? await client.fagc.rules.fetchRule({
				ruleid: guildConfig.ruleFilters[Number(ruleID) - 1],
			  })
			: await client.fagc.rules.fetchRule({ ruleid: ruleID })

		if (rule === null)
			return message.reply(
				`${client.emotes.warn} No rule with ID of \`${ruleID}\` exists`,
			)

		const embed = client.createBaseEmbed()
			.setTitle("FAGC Rules")
			.setDescription(`FAGC Rule with ID \`${rule.id}\``)
		embed.addField(rule.shortdesc, rule.longdesc)

		if (client.config && guildConfig.ruleFilters) {
			if (guildConfig.ruleFilters.indexOf(rule.id) != -1) {
				embed.addField(
					"Rule index",
					(guildConfig.ruleFilters.indexOf(rule.id) + 1).toString(),
				)
			}
		}

		return message.channel.send({
			embeds: [embed],
		})
	},
}

export default Rule
