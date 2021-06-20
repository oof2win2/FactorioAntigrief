import Command from "../../base/Command"
import {Message, MessageEmbed} from "discord.js"
import { getConfirmationMessage } from "../../utils/responseGetter"
import { HandleUnfilteredRevocation } from "../../base/FAGCHandler"
import { Revocation } from "fagc-api-wrapper"

export const command: Command<Message|void> = {
	name: "addignore",
	description: "Ignores a specific violation",
	dirname: __dirname,
	enabled: true,
	aliases: [],
	memberPermissions: ["BAN_MEMBERS"],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: ["ban"],
	run: async (client, message, args) => {
		if (!args[0]) return message.channel.send("Please provide a violation ID to ignore")

		const report = await client.fagc.reports.fetchReport(args[0]).catch()
		if (!report?.id) return message.channel.send(`\`${args[0]}\` is an invalid violation ID`)
		const embed = new MessageEmbed()
			.setTitle("FAGC Violation Ignoration")
			.setColor("ORANGE")
			.setDescription("FAGC Violation Ignoration")
			.setTimestamp()
			.setAuthor("oof2win2")
			.addFields(
				{ name: "Playername", value: report.playername, inline:true },
				{ name: "Admin ID", value: report.adminId, inline:true },
				{ name: "Community ID", value: report.communityId, inline:true },
				{ name: "Broken Rule", value: report.brokenRule, inline:true },
				{ name: "Automated", value: report.automated, inline:true },
				{ name: "Proof", value: report.proof, inline:true },
				{ name: "Description", value: report.description, inline:true },
				{ name: "Report ID", value: report.id, inline:true },
				{ name: "Reported Time", value: report.reportedTime, inline:true }
			)
		message.channel.send(embed)
		const confirm = await getConfirmationMessage("Are you sure you want to ignore this report?", message)
		if (!confirm) return message.channel.send("Report ignoration cancelled")

		const ignoration = await client.prisma.ignoredViolations.create({data: {
			playername: report.playername,
			violationId: report.id,
			whitelistedAt: new Date(),
			whitelistedBy: message.author.id
		}})
		if (ignoration.whitelistedBy === message.author.id) {
			const playerReports = await client.getFilteredReports(ignoration.playername)
			if (!playerReports.length) {
				// because it is much easier than creating a revocation, just send in a violation as a revocation
				HandleUnfilteredRevocation(report as Revocation, client)
				return message.channel.send(`Report with ID \`${report.id}\` has been whitelisted. Since they don't have any other reports, an action has been taken`)
			} else
				return message.channel.send(`Report with ID \`${report.id}\` has been whitelisted. Since they do have other reports, no action has been taken`)
		}
	}
}