const { MessageEmbed } = require("discord.js")
const {
	getMessageResponse,
	getConfirmationMessage,
} = require("../../utils/responseGetter")
const { handleErrors, createPagedEmbed } = require("../../utils/functions")
const Command = require("../../base/Command")
const { AuthenticationError } = require("fagc-api-wrapper")
const validator = require("validator").default

class CreateReport extends Command {
	constructor(client) {
		super(client, {
			name: "create",
			description:
				"Creates a report. Use the advanced method to add in time of report created and who created it. This command defaults to now and you",
			aliases: [ "createreport", "ban", "banhammer" ],
			usage: "(playername) (description)",
			examples: [ "{{p}}createadvanced", "{{p}}createadvanced Windsinger", "{{p}}createadvanced Windsinger big bad griefer" ],
			category: "reports",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [ "BAN_MEMBERS" ],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: [ "reports" ],
		})
	}
	async run(message, args, config) {
		if (!config.apikey) return message.reply(`${this.client.emotes.warn} No API key set`)

		const playername = args.shift() || (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in a playername for the report`
			)
		)?.content
		if (playername === undefined)
			return message.channel.send(`${this.client.emotes.warn} Didn't send playername in time`)
		
		let ruleEmbed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				"Filtered FAGC Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)

		const filteredRules = await this.client.getFilteredRules(config)
		const fields = filteredRules.map((rule) => {
			return {
				name: `${config.ruleFilters.indexOf(rule.id)+1}) ${rule.shortdesc} (\`${rule.id}\`)`,
				value: rule.longdesc,
			}
		})
		createPagedEmbed(fields, ruleEmbed, message, { maxPageCount: 10 })

		const ruleids = (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in IDs of rules (or indexes in filtered rules) that has been broken, separated by spaces`
			)
		)?.content
		if (ruleids === undefined)
			return message.channel.send(`${this.client.emotes.warn} Didn't send rule IDs in time`)
		let ruleInput = ruleids.split(" ")
		const ruleNumbers = ruleInput
			.map((rule, i) => {
				const ruleNumber = parseInt(rule) || undefined
				// remove the number from input if it is a numher
				if (ruleNumber)
					ruleInput = ruleInput.filter((_, inputI) => inputI != i)
				return ruleNumber
			})
			.filter((r) => r)

		// validate that all rule indexes do exist
		const invalid = ruleNumbers
			.map((number) => filteredRules.length < number && number)
			.filter((i) => i)
		if (invalid.length)
			return message.channel.send(
				`${this.client.emotes.warn} Invalid indexes were provided: ${invalid.join(", ")}`
			)

		const numberRules = ruleNumbers.map(
			(ruleNumber) => filteredRules[ruleNumber - 1]
		)
		let rules = await Promise.all(
			ruleInput.map((ruleid) => this.client.fagc.rules.fetchRule(ruleid))
		)
		rules = rules.filter((r) => r).concat(numberRules)

		if (!rules.length)
			return message.channel.send(`${this.client.emotes.warn} No valid rules were provided`)

		if (rules.length !== ruleids.split(" ").length) {
			const invalidRules = ruleids
				.split(" ")
				.filter((r) => {
					if (parseInt(r)) return false
					return true
				})
				.filter((r) => !rules.find((rule) => rule.id == r) && r)
				.filter((r) => r)
			return message.channel.send(
				`${this.client.emotes.warn} Some rules had invalid IDs: \`${invalidRules.join("`, `")}\``
			)
		}

		for (const rule of rules) {
			if (config.ruleFilters.indexOf(rule.id) === -1)
				return message.channel.send(
					`${this.client.emotes.warn} Rule ${rule.id} is not filtered by your community but you tried to report with it`
				)
		}

		let desc = args.join(" ") || (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in description of the report or \`none\` if you don't want to set one`
			)
		)?.content
		if (!desc || desc.toLowerCase() === "none") desc = undefined

		let proof = (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Send links to proof of the report, separated with spaces, or \`none\` if there is no proof`
			)
		)?.content
		if (!proof || proof.toLowerCase() === "none") proof = undefined
		for (const string of proof.split(" ")) {
			if (!validator.isURL(string, { protocols: [ "http", "https" ] })) {
				return message.channel.send(`${this.client.emotes.warn}  \`${string}\` is an invalid link to proof`)
			}
		}

		const timestamp = Date.now()

		let embed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("RED")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`Create FAGC report for \`${playername}\``)
		embed.addFields(
			{
				name: "Admin user",
				value: `<@${message.author.id}> | ${message.author.tag}`,
				inline: true,
			},
			{ name: "Player name", value: playername, inline: true },
			{
				name: "Rules",
				value: rules
					.map((rule) => `${rule.shortdesc} (\`${rule.id}\`)`)
					.join(", "),
				inline: true,
			},
			{
				name: "Report description",
				value: desc || "No description",
				inline: true,
			},
			{ name: "Proof", value: proof || "No proof" },
			{
				name: "Violated At",
				value: `<t:${Math.round(timestamp / 1000)}>`,
			}
		)
		message.channel.send(embed)
		const confirm = await getConfirmationMessage(
			message,
			"Do you wish to create these rule reports?"
		)
		if (!confirm) return message.channel.send("Report creation cancelled")

		try {
			const reports = await Promise.all(
				rules.map((rule) =>
					this.client.fagc.reports.create(
						{
							playername: playername,
							adminId: message.author.id,
							brokenRule: rule.id,
							proof: proof,
							description: desc,
							automated: false,
							reportedTime: new Date(timestamp),
						},
						true,
						{ apikey: config.apikey }
					)
				)
			)
			if (
				reports.length &&
				reports[0].brokenRule &&
				reports[0].reportedTime
			) {
				return message.channel.send(
					`Report(s) created! ids: \`${reports
						.map((report) => report.id)
						.join("`, `")}\``
				)
			} else {
				return handleErrors(message, reports)
			}
		} catch (error) {
			if (error instanceof AuthenticationError)
				return message.channel.send(`${this.client.emotes.error} Your API key is set incorrectly`)
			message.channel.send(`${this.client.emotes.error} Error creating report. Please check logs.`)
			throw error
		}
	}
}
module.exports = CreateReport
