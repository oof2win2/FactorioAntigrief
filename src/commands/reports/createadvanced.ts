import { EmbedField, MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { createPagedEmbed } from "../../utils/functions";
import { getConfirmationMessage, getMessageResponse } from "../../utils/responseGetter";
import validator from "validator";

const CreateAdvanced: Command = {
	name: "createadvanced",
	aliases: [ "createadv", "createadvanced" ],
	usage: "[player] [...description]",
	examples: ["create", "create Potato", "create Potato hacking"],
	description: "Create a report for a player, with the possiblity of input of admin who banned the user and customizing the time when the player was reported",
	category: "reports",
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	async run({client, message, args, guildConfig}) {
		if (!guildConfig.ruleFilters.length) return message.channel.send(`${client.emotes.warn} No rules are filtered`)
		const playername = args.shift() || await getMessageResponse(message, `${client.emotes.type} Type in the player name`).then((x) => x?.content)
		if (!playername) return message.channel.send(`${client.emotes.warn} No player name was provided`)
		
		const adminUserMessage = await getMessageResponse(message, `${client.emotes.type} Type in the admin user (ping or ID) who banned the player`)
		if (!adminUserMessage) return message.channel.send(`${client.emotes.warn} No admin user was provided`)
		const adminUser = adminUserMessage.mentions.users.first() || await client.users.fetch(adminUserMessage.content).catch(() => null)
		if (!adminUser) return message.channel.send(`${client.emotes.warn} No admin user was provided`)

		let description = args.join(" ") || await getMessageResponse(message, `${client.emotes.type} Type in the description of the report, or "none" if no description`).then((x) => x?.content)
		if (!description || description.toLowerCase() === "none") description = "No description"

		const timestampMessage = await getMessageResponse(message, `${client.emotes.type} Type in the ISO8601 timestamp of when the player was reported (or "now" if current time). Use <https://www.timestamp-converter.com/> to find the timestamp`).then((x) => x?.content)
		let timestamp: Date
		if (!timestampMessage || timestampMessage.toLowerCase() === "now") timestamp = new Date()
		else timestamp = new Date(timestampMessage)
		// new Date doesn't throw an error if an invalid string is provided, it instead makes the date object `Invalid Date`
		if (isNaN(timestamp.valueOf())) return message.channel.send(`${client.emotes.warn} Invalid timestamp provided`)

		// send a message with the community's filtered rules to pick from
		const ruleEmbed = new MessageEmbed()
		.setTitle("FAGC Reports")
		.setColor("RED")
		.setTimestamp()
		.setAuthor({name: client.config.embeds.author})
		.setFooter({text: client.config.embeds.footer})
		.setDescription("Your community's filtered rules")
		const allRules = await client.fagc.rules.fetchAll({})
		const fields: EmbedField[] = allRules
			// make sure the rule is filtered
			.filter((rule) => guildConfig.ruleFilters.includes(rule.id))
			// sort the rules by their index
			.sort((a, b) => {
				if (guildConfig.ruleFilters.indexOf(a.id) > guildConfig.ruleFilters.indexOf(b.id)) return 1
				if (guildConfig.ruleFilters.indexOf(a.id) < guildConfig.ruleFilters.indexOf(b.id)) return -1
				return 0
			})
			.map((rule) => {
				return {
					name: `${guildConfig.ruleFilters.indexOf(rule.id)+1}) ${rule.shortdesc} (\`${rule.id}\`)`,
					value: rule.longdesc,
					inline: false
				}
			})
		createPagedEmbed(fields, ruleEmbed, message)

		const rules = await getMessageResponse(
		message,
		`${client.emotes.type} Type in the rule(s) broken by the player, separated with spaces`
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
			const found = guildConfig.ruleFilters[i - 1]
			id = found
		}
		// all rules are fetched above so they are cached
		const rule = client.fagc.rules.resolveID(id)
		if (!rule) invalidRuleIds.push(id)
		else validRuleIDs.push(id)
		})
		if (invalidRuleIds.length) return message.channel.send(`Invalid rule(s): \`${invalidRuleIds.join("`, `")}\``)

		let proof =
			await getMessageResponse(
				message,
				`${client.emotes.type} Send links to proof of the report, separated with spaces, or \`none\` if there is no proof`
			).then(x => x?.content)
		if (!proof || proof.toLowerCase() === "none") proof = undefined
		if (proof && proof !== "No proof") {
			// check if each link is a valid URL
			const areAllURLs = proof.split(" ").map((link) => validator.isURL(link)).reduce((a, b) => a && b)
			if (!areAllURLs) return message.channel.send(`${client.config.emotes.warn} Invalid proof link(s)`)
		}

		// send an embed to display the report that will be created
		const checkEmbed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("RED")
			.setTimestamp()
			.setAuthor({name: client.config.embeds.author})
			.setFooter({text: client.config.embeds.footer})
			// .setDescription(`**Report created by ${message.author.tag}**\n\n**Player:** ${playername}\n**Rule(s):** ${validRuleIDs.join(", ")}\n**Description:** ${desc}\n**Proof:** ${proof}`)
			.addFields([
				{name: "Player", value: playername, inline: true},
				{name: "Rule(s)", value: validRuleIDs.map(id => `${client.fagc.rules.resolveID(id)?.shortdesc} (\`${id}\`)`).join(", "), inline: true},
				{name: "Description", value: description || "No description", inline: true},
				{name: "Proof", value: proof || "No proof", inline: true},
				{name: "Reported at", value: `<t:${Math.round(timestamp.valueOf() / 1000)}>`, inline: true}
			])
		message.channel.send({
			embeds: [checkEmbed]
		})
		const confirmationMessage = await getConfirmationMessage(message, "Are you sure you want to create these reports?")
		if (!confirmationMessage) return message.channel.send("Report creation cancelled")

		// create the reports for each rule
		const reports = await Promise.all(
			validRuleIDs.map(async (ruleId) => {
				return client.fagc.reports.create({
					report: {
						playername: playername,
						adminId: adminUser.id,
						description: description ?? "No description",
						proof: proof ?? "No proof",
						brokenRule: ruleId,
						reportedTime: timestamp,
						automated: false
					},
					reqConfig: {
						apikey: guildConfig.apiKey || ""
					}
				})
			})
		)
		return message.channel.send(`Reports created with IDs: ${reports.map(report => `\`${report.id}\``).join(", ")}`)
	}
}
export default CreateAdvanced