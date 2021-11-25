const { MessageEmbed } = require("discord.js")
const { handleErrors } = require("../../utils/functions")
const Command = require("../../base/Command")
const { getConfirmationMessage, getMessageResponse } = require("../../utils/responseGetter")
const { AuthenticationError } = require("fagc-api-wrapper")

class Revoke extends Command {
	constructor(client) {
		super(client, {
			name: "revoke",
			description: "Revokes a player's report with the report ID",
			aliases: [ "revokeid" ],
			category: "reports",
			usage: "[reportid]",
			examples: [ "{{p}}revoke p1UgG0G" ],
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

		if (!args[0])
			args[0] = await getMessageResponse(message, `${this.client.emotes.type} Provide a report to fetch`)
				.then((r) => r?.content)
		const reportID = args.shift()
		if (!reportID) return message.channel.send(`${this.client.emotes.warn} No report was provided`)

		const report = await this.client.fagc.reports.fetchReport(reportID)
		if (!report?.id)
			return message.channel.send(
				`Report with ID \`${reportID}\` doesn't exist`
			)
		if (report.error && report.description.includes("id expected ID"))
			return message.reply(`\`${reportID}\` is not a proper report ID`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Report Revocation")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				`FAGC Report \`${report.id}\` of player \`${report.playername}\` in community ${config.communityname}`
			)
		const creator = await this.client.users.fetch(report.adminId)
		embed.addFields(
			{ name: "Admin", value: `<@${creator.id}> | ${creator.tag}` },
			{ name: "Broken rule ID", value: report.brokenRule },
			{ name: "Proof", value: report.proof },
			{ name: "Description", value: report.description },
			{ name: "Automated", value: report.automated },
			{ name: "Violated time", value: Date(report.reportedTime) }
		)
		message.channel.send(embed)

		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want to revoke this report?"
		)
		if (!confirm) return message.channel.send("Report revocation cancelled")

		try {
			const response = await this.client.fagc.reports.revoke(
				reportID,
				message.author.id,
				true,
				{ apikey: config.apikey }
			)

			if (response.id && response.revokedBy && response.revokedTime) {
				return message.channel.send("Report revoked!")
			} else {
				return handleErrors(message, response)
			}
		} catch (error) {
			if (error instanceof AuthenticationError)
				return message.channel.send("Your API key is set incorrectly")
			message.channel.send("Error revoking report. Please check logs.")
			throw error
		}
	}
}
module.exports = Revoke
