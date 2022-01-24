import { EmbedField } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import { Rule } from "fagc-api-types"

const AddRule: Command = {
	name: "addrule",
	description:
		"Adds a rule filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
	aliases: ["addrules"],
	usage: "[...ids]",
	examples: ["addrule XuciBx7", "addrule XuciBx7 XuciBx9 XuciBx/"],
	category: "rules",
	requiresRoles: true,
	requiredPermissions: ["setRules"],
	requiresApikey: false,
	run: async ({ client, message, guildConfig, args }) => {
		// if they haven't provided any IDs, we'll show them all the rules and ask for IDs
		const allRules = await client.fagc.rules.fetchAll({})
		if (!args[0]) {
			const embed = client.createBaseEmbed()
				.setTitle("FAGC Rules")
				.setDescription("All FAGC Rules")
			const fields: EmbedField[] = []
			for (let i = 0; i < allRules.length; i += 2) {
				fields.push({
					value: `**${allRules[i].shortdesc}** (\`${allRules[i].id}\`)`,
					name:
						allRules[i + 1] &&
						`${allRules[i + 1].shortdesc} (\`${allRules[i + 1].id}\`)`,
					inline: false,
				})
			}
			createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
			const newIDsMessage = await client.getMessageResponse(
				message,
				`${client.emotes.type} No rules provided. Please provide IDs`,
			)

			if (!newIDsMessage || !newIDsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIDsMessage.content.split(" ")
		}

		// get the IDs that are not in their config
		const newRules = args
			.map((ruleid) => client.fagc.rules.resolveID(ruleid))
			.filter((r): r is Rule => Boolean(r))
			.filter((r) => !guildConfig.ruleFilters.includes(r.id))

		// if there are no new rules, return
		if (!newRules.length)
			return message.channel.send("No valid or non-duplicate rules to be added")

		// send the new rules as an embed
		const newRuleEmbed = client.createBaseEmbed()
			.setTitle("FAGC Rules")
			.setDescription("New Rules")
		const newRuleFields = newRules.map((rule) => {
			return {
				name: `${rule.shortdesc} (\`${rule.id}\`)`,
				value: rule.longdesc,
				inline: false,
			}
		})
		createPagedEmbed(newRuleFields, newRuleEmbed, message, { maxPageCount: 10 })

		// ask for confirmation if they want it like this
		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to add these rules to your rule filters?",
		)
		if (!confirm) return message.channel.send("Adding rules cancelled")

		// add the new rules to the config
		const newRuleIds = new Set([
			...guildConfig.ruleFilters,
			...newRules.map((r) => r.id),
		])

		// save the config
		await client.saveGuildConfig({
			guildId: message.guild.id,
			ruleFilters: [...newRuleIds],
			apikey: guildConfig.apiKey ?? undefined,
		})

		// send a success message
		return message.channel.send("Successfully added filtered rules")
	},
}
export default AddRule
