import { EmbedField, MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import validator from "validator"

const CreateReport: Command = {
	name: "createreport",
	description: "Create a report for a player",
	category: "reports",
	aliases: ["create", "ban"],
	usage: "[player] [...description]",
	examples: ["create", "create Potato", "create Potato hacking"],
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	run: async ({ client, message, args, guildConfig }) => {
		if (!guildConfig.ruleFilters.length)
			return message.channel.send(`${client.emotes.warn} No rules are filtered`)

		const playername = await client.argsOrInput(args, message, `${client.emotes.type} Type in the player name`)
		if (!playername) return message.channel.send("Player name not specified")

		// send a message with the community's filtered rules to pick from
		const ruleEmbed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("RED")
			.setTimestamp()
			.setAuthor({ name: client.config.embeds.author })
			.setFooter({ text: client.config.embeds.footer })
			.setDescription("Your community's filtered rules")
		const allRules = await client.fagc.rules.fetchAll({})
		const fields: EmbedField[] = allRules
			// make sure the rule is filtered
			.filter((rule) => guildConfig.ruleFilters.includes(rule.id))
			// sort the rules by their index
			.sort((a, b) => guildConfig.ruleFilters.indexOf(a.id) - guildConfig.ruleFilters.indexOf(b.id))
			.map((rule) => {
				return {
					name: `${guildConfig.ruleFilters.indexOf(rule.id) + 1}) ${
						rule.shortdesc
					} (\`${rule.id}\`)`,
					value: rule.longdesc,
					inline: false,
				}
			})
		createPagedEmbed(fields, ruleEmbed, message)

		const rules = await client.getMessageResponse(
			message,
			`${client.emotes.type} Type in the rule(s) broken by the player, separated with spaces`,
		)
		if (!rules) return message.channel.send("Rule(s) not specified")
		const ruleIds = rules.content.split(" ")
		if (ruleIds.length === 1 && ruleIds[0] === "none") {
			return message.channel.send("Rule(s) not specified")
		}
		// check for validity of rules, sort into valid and invalid IDs
		const invalidRuleIds: string[] = []
		const validRuleIDs: string[] = []
		ruleIds.map((ruleId) => {
			let id: string
			if (isNaN(Number(ruleId))) {
				// id is string
				id = ruleId
			} else {
				// id is index in rule filters
				const i = Number(ruleId)
				if (i < 0 || i > guildConfig.ruleFilters.length) {
					return invalidRuleIds.push(ruleId)
				}
				id = guildConfig.ruleFilters[i - 1]
			}
			// all rules are fetched above so they are cached
			const rule = client.fagc.rules.resolveID(id)
			if (!rule) invalidRuleIds.push(id)
			else validRuleIDs.push(id)
		})
		if (invalidRuleIds.length)
			return message.channel.send(
				`Invalid rule(s): \`${invalidRuleIds.join("`, `")}\``,
			)

		let desc =
			args.join(" ") ||
			(await client.getMessageResponse(
				message,
				`${client.emotes.type} Type in description of the report or \`none\` if you don't want to set one`,
			).then((m) => m?.content))
		if (!desc || desc.toLowerCase() === "none") desc = undefined

		let proof = await client.getMessageResponse(
			message,
			`${client.emotes.type} Send links to proof of the report, separated with spaces, or \`none\` if there is no proof`,
		).then((x) => x?.content)
		if (!proof || proof.toLowerCase() === "none") proof = "No proof"
		if (proof !== "No proof") {
			// check if each link is a valid URL
			const areAllURLs = proof
				.split(" ")
				.map((link) => validator.isURL(link))
				.reduce((a, b) => a && b)
			if (!areAllURLs)
				return message.channel.send(
					`${client.config.emotes.warn} Invalid proof link(s)`,
				)
		}

		const timestamp = Date.now()

		// send an embed to display the report that will be created
		const checkEmbed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("RED")
			.setTimestamp()
			.setAuthor({ name: client.config.embeds.author })
			.setFooter({ text: client.config.embeds.footer })
			// .setDescription(`**Report created by ${message.author.tag}**\n\n**Player:** ${playername}\n**Rule(s):** ${validRuleIDs.join(", ")}\n**Description:** ${desc}\n**Proof:** ${proof}`)
			.addFields([
				{ name: "Player", value: playername, inline: true },
				{
					name: "Rule(s)",
					value: validRuleIDs
						.map(
							(id) =>
								`${client.fagc.rules.resolveID(id)?.shortdesc} (\`${id}\`)`,
						)
						.join(", "),
					inline: true,
				},
				{ name: "Description", value: desc || "No description", inline: true },
				{ name: "Proof", value: proof || "No proof", inline: true },
				{
					name: "Reported at",
					value: `<t:${Math.round(timestamp / 1000)}>`,
					inline: true,
				},
			])
		message.channel.send({
			embeds: [checkEmbed],
		})
		const confirmationMessage = await client.getConfirmationMessage(
			message,
			"Are you sure you want to create these reports?",
		)
		if (!confirmationMessage)
			return message.channel.send("Report creation cancelled")

		// create the reports for each rule
		const reports = await Promise.all(
			validRuleIDs.map(async (ruleId) => {
				return client.fagc.reports.create({
					report: {
						playername: playername,
						adminId: message.author.id,
						description: desc ?? "No description",
						proof: proof ?? "No proof",
						brokenRule: ruleId,
						reportedTime: new Date(timestamp),
						automated: false,
					},
					reqConfig: {
						apikey: guildConfig.apiKey || "",
					},
				})
			}),
		)
		return message.channel.send(
			`Reports created with IDs: ${reports
				.map((report) => `\`${report.id}\``)
				.join(", ")}`,
		)
	},
}
export default CreateReport
