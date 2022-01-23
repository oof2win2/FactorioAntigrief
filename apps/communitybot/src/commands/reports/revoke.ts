// const { MessageEmbed } = require("discord.js")
// const { handleErrors } = require("../../utils/functions")
// const Command = require("../../base/Command")
// const { getConfirmationMessage, getMessageResponse } = require("../../utils/responseGetter")
// const { AuthenticationError } = require("fagc-api-wrapper")

import { MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { getConfirmationMessage, getMessageResponse } from "../../utils/responseGetter";

// class Revoke extends Command {
// 	constructor(client) {
// 		super(client, {
// 			name: "revoke",
// 			description: "Revokes a player's report with the report ID",
// 			aliases: [ "revokeid" ],
// 			category: "reports",
// 			usage: "[reportid]",
// 			examples: [ "{{p}}revoke p1UgG0G" ],
// 			dirname: __dirname,
// 			enabled: true,
// 			memberPermissions: [ "BAN_MEMBERS" ],
// 			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
// 			ownerOnly: false,
// 			cooldown: 3000,
// 			requiredConfig: true,
// 			customPermissions: [ "reports" ],
// 		})
// 	}
// 	async run(message, args, config) {
// 		if (!config.apikey) return message.reply(`${this.client.emotes.warn} No API key set`)

// 		if (!args[0])
// 			args = await getMessageResponse(message, `${this.client.emotes.type} Provide a report to revoke`)
// 				.then((r) => r?.content?.split(" "))
// 		const reportID = args.shift()
// 		if (!reportID) return message.channel.send(`${this.client.emotes.warn} No report was provided`)

// 		const report = await this.client.fagc.reports.fetchReport({ reportid: reportID })
// 		if (!report?.id)
// 			return message.channel.send(
// 				`Report with ID \`${reportID}\` doesn't exist`
// 			)
// 		if (report.communityId !== config.communityId)
// 			return message.channel.send(`You are trying to revoke a report of community \`${report.communityId}\` but you are from community \`${config.communityId}\``)
// 		const community = await this.client.fagc.communities.fetchCommunity({ communityID: report.communityId })

// 		let embed = new MessageEmbed()
// 			.setTitle("FAGC Report Revocation")
// 			.setColor("GREEN")
// 			.setTimestamp()
// 			.setAuthor("FAGC Community")
// 			.setDescription(
// 				`FAGC Report \`${report.id}\` of player \`${report.playername}\` in community ${community.name} (\`${community.id}\`)`
// 			)
// 		const creator = await this.client.users.fetch(report.adminId)
// 		embed.addFields(
// 			{ name: "Admin", value: `<@${creator.id}> | ${creator.tag}` },
// 			{ name: "Broken rule ID", value: report.brokenRule },
// 			{ name: "Proof", value: report.proof },
// 			{ name: "Description", value: report.description },
// 			{ name: "Automated", value: report.automated },
// 			{ name: "Violated time", value: `<t:${Math.round(report.reportedTime/1000)}>` }
// 		)
// 		message.channel.send(embed)

// 		const confirm = await getConfirmationMessage(
// 			message,
// 			"Are you sure you want to revoke this report?"
// 		)
// 		if (!confirm) return message.channel.send("Report revocation cancelled")

// 		try {
// 			const response = await this.client.fagc.reports.revoke({
// 				reportid: reportID,
// 				adminId: message.author.id,
// 				reqConfig: { apikey: config.apikey }
// 			})

// 			if (response.id && response.revokedBy && response.revokedTime) {
// 				return message.channel.send("Report revoked!")
// 			} else {
// 				return handleErrors(message, response)
// 			}
// 		} catch (error) {
// 			if (error instanceof AuthenticationError)
// 				return message.channel.send("Your API key is set incorrectly")
// 			message.channel.send("Error revoking report. Please check logs.")
// 			throw error
// 		}
// 	}
// }
// module.exports = Revoke


const RevokeReport: Command = {
	name: "revoke",
	description: "Revokes a player's report with the report ID",
	aliases: [ "revokeid" ],
	category: "reports",
	usage: "[reportid]",
	examples: [ "revoke p1UgG0G" ],
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	async run({ message, args, guildConfig, client }) {
		if (!guildConfig.apiKey) return message.reply(`${client.emotes.warn} No API key set`)
		const id = args.shift() || await getMessageResponse(message, `${client.emotes.type} Provide a report ID to revoke`).then((x) => x?.content?.split(" ")[0])
		if (!id) return message.channel.send(`${client.emotes.warn} No report ID was provided`)

		const report = await client.fagc.reports.fetchReport({ reportId: id })
		if (!report) return message.channel.send(`${client.emotes.warn} Report with ID \`${id}\` doesn't exist`)

		if (report.communityId !== guildConfig.communityId) return message.channel.send(`You are trying to revoke a report of community \`${report.communityId}\`, but you are from community \`${guildConfig.communityId}\``)

		const adminUser = await client.users.fetch(report.adminId).catch(() => null)
		const embed = new MessageEmbed()
			.setTitle("FAGC Report Revocation")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({name: client.config.embeds.author})
			.setFooter({text: client.config.embeds.footer})
			.setDescription(`FAGC Report \`${report.id}\` of player \`${report.playername}\``)
			.addFields([
				{ name: "Admin", value: `<@${report.adminId}> | ${adminUser?.tag ?? "Unknown"}` },
				{ name: "Broken rule ID", value: report.brokenRule },
				{ name: "Description", value: report.description },
				{ name: "Proof", value: report.proof },
				{ name: "Automated", value: report.automated ? "True" : "False" },
				{name: "Reported At", value: `<t:${Math.round(report.reportedTime.valueOf() / 1000)}>`},
				{name: "Report Created At", value: `<t:${Math.round(report.reportCreatedAt.valueOf() / 1000)}>`}
			])
		message.channel.send({
			embeds: [embed]
		})
		const confirm = await getConfirmationMessage(message, "Are you sure you want to revoke this report?")
		if (!confirm) return message.channel.send("Report revocation cancelled")

		try {
			const response = await client.fagc.revocations.revoke({
				reportId: id,
				adminId: message.author.id,
				reqConfig: { apikey: guildConfig.apiKey }
			})

			return message.channel.send("Report revoked!")
		} catch (e) {
			message.channel.send("Error revoking report. Please check logs.")
			throw e
		}
	}
}

export default RevokeReport