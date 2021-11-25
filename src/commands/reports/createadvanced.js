const { MessageEmbed } = require("discord.js")
const {
	getMessageResponse,
	getConfirmationMessage,
} = require("../../utils/responseGetter")
const { handleErrors } = require("../../utils/functions")
const Command = require("../../base/Command")
const { AuthenticationError } = require("fagc-api-wrapper")

class CreateReportAdvanced extends Command {
	constructor(client) {
		super(client, {
			name: "createadvanced",
			description:
				"Creates a report - Advanced method. Allows specification of who created the report and when it was created",
			aliases: [ "banadvanced", "createadv", "banadv" ],
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

	async run(message, _, config) {
		if (!config.apikey) return message.reply(`${this.client.emotes.warn} No API key set`)

		const playername = (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in a playername for the report`
			)
		)?.content
		if (playername === undefined)
			return message.channel.send(`${this.client.emotes.warn} Didn't send playername in time`)

		const adminMessage = await getMessageResponse(
			message,
			`${this.client.emotes.type} Type in admin user ID for the report`
		)
		if (adminMessage === undefined)
			return message.channel.send(`${this.client.emotes.warn} Didn't send admin user ID in time`)
		const adminUser =
			adminMessage.mentions.users.first() ||
			(await this.client.users.fetch(adminMessage.content))
		if (!adminUser) return message.channel.send(`${this.client.emotes.warn} Sent user is not valid!`)

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
		const filteredRules = await this.client.getFilteredRules(config)

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

		let desc = (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in description of the report or \`none\` if you don't want to set one`
			)
		)?.content
		if (!desc || desc.toLowerCase() === "none") desc = undefined

		let proof = (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Send a link to proof of the report or \`none\` if there is no proof`
			)
		)?.content
		if (!proof || proof.toLowerCase() === "none") proof = undefined

		const timestampMsg = (
			await getMessageResponse(
				message,
				`${this.client.emotes.type} Send a value representing the date of the report. Type in \`now\` to set the current time`
			)
		)?.content
		let timestamp = new Date()
		if (timestampMsg.toLowerCase() === "now") timestamp = new Date()
		else {
			timestamp = new Date(timestampMsg)
			if (isNaN(timestamp.valueOf())) {
				timestamp = new Date()
				message.channel.send(
					`${this.client.emotes.warn} \`${timestampMsg}\` could not be recognized as a date so the current date will be used instead`
				)
			}
		}

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
							adminId: adminUser.id,
							brokenRule: rule.id,
							proof: proof,
							description: desc,
							automated: false,
							reportedTime: timestamp,
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
				return message.channel.send("Your API key is set incorrectly")
			message.channel.send(`${this.client.emotes.error} Error creating reports. Please check logs.`)
			throw error
		}
	}
}
module.exports = CreateReportAdvanced
