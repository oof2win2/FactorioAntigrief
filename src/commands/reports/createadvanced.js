const { MessageEmbed } = require("discord.js")
const { getMessageResponse, getConfirmationMessage } = require("../../utils/responseGetter")
const { handleErrors } = require("../../utils/functions")
const Command = require("../../base/Command")
const { AuthenticationError } = require("fagc-api-wrapper")

class CreateReportAdvanced extends Command {
	constructor(client) {
		super(client, {
			name: "createadvanced",
			description: "Creates a report - Advanced method. Allows specification of who created the report and when it was created",
			aliases: ["banadvanced", "createadv", "banadv"],
			category: "reports",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["BAN_MEMBERS"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["reports"]
		})
	}
	async run(message, _, config) {
		if (!config.apikey) return message.reply("No API key set")

		const playername = (await getMessageResponse(message, "Please type in a playername for the report"))?.content
		if (playername === undefined) return message.channel.send("Didn't send playername in time")

		const admin_message = (await getMessageResponse(message, "Please type in admin user ID for the report"))
		if (admin_message === undefined) return message.channel.send("Didn't send admin user ID in time")
		const admin_user = admin_message.mentions.users.first() || await this.client.users.fetch(admin_message.content)
		if (!admin_user) return message.channel.send("Sent user is not valid!")

		const ruleid = (await getMessageResponse(message, "Please type in ID of rule (or index in filtered rules) that has been broken"))?.content
		if (ruleid === undefined) return message.channel.send("Didn't send rule ID in time")
		const ruleNumber = parseInt(ruleid) || undefined

		let desc = (await getMessageResponse(message, "Please type in description of the report or `none` if you don't want to set one"))?.content
		if (desc.toLowerCase() === "none") desc = undefined

		let proof = (await getMessageResponse(message, "Please send a link to proof of the report or `none` if there is no proof"))?.content
		if (proof.toLowerCase() === "none") proof = undefined

		const timestampMsg = (await getMessageResponse(message, "Please send a value representing the date of the report. Type in `now` to set the current time"))?.content
		let timestamp = new Date()
		if (timestampMsg.toLowerCase() === "now") timestamp = new Date()
		else {
			timestamp = new Date(timestampMsg)
			if (isNaN(timestamp.valueOf())) {
				timestamp = new Date()
				message.channel.send(`\`${timestampMsg}\` could not be recognized as a date so the current date will be used instead`)
			}
		}

		const rule = ruleNumber
			? await this.client.getFilteredRules(config).then(rules => rules[ruleNumber-1])
			: await this.client.fagc.rules.fetchRule(ruleid)

		if (!rule) return message.channel.send(ruleNumber
			? `A filtered rule with the index of ${ruleNumber} does not exist!`
			: `A rule with the ID of \`${ruleid}\` does not exist!`
		)

		let embed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("RED")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`Create FAGC report for \`${playername}\``)
		embed.addFields(
			{ name: "Admin user", value: `<@${admin_user.id}> | ${admin_user.tag}`, inline: true },
			{ name: "Player name", value: playername, inline: true },
			{ name: "Rule", value: `${rule.shortdesc} (\`${rule.id}\`)`, inline: true },
			{ name: "Report description", value: desc, inline: true },
			{ name: "Proof", value: proof },
			{ name: "Violated At", value: `<t:${Math.floor(timestamp.valueOf()/1000)}>` }
		)
		message.channel.send(embed)
		const confirm = await getConfirmationMessage(message, "Do you wish to create this report?")
		if (!confirm) return message.channel.send("Report creation cancelled")
		
		try {
			const response = await this.client.fagc.reports.create({
				playername: playername,
				adminId: admin_user.id,
				brokenRule: rule.id,
				proof: proof,
				description: desc,
				automated: false,
				reportedTime: timestamp
			}, true, {apikey: config.apikey})
			if (response.id && response.brokenRule && response.reportedTime) {
				return message.channel.send(`Report created! id: \`${response.id}\``)
			} else if (response.error && response.description.includes("brokenRule expected ID")) {
				return message.channel.send("RuleID is an invalid rule ID. Please check `fagc!getrules` or `fagc!getallrules`")
			} else {
				return handleErrors(message, response)
			}
		} catch (error) {
			if (error instanceof AuthenticationError) return message.channel.send("Your API key is set incorrectly")
			message.channel.send("Error creating report. Please check logs.")
			throw error
		}
	}
}
module.exports = CreateReportAdvanced