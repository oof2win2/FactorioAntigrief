import Command from "../../base/Command.js"
import { Message, MessageEmbed } from "discord.js"
import { getConfirmationMessage } from "../../utils/responseGetter.js"

export const command: Command<Message | void> = {
	name: "removeignore",
	description: "Removes ignoration of a specific violation",
	category: "ignoredviolations",
	enabled: true,
	aliases: [],
	memberPermissions: ["BAN_MEMBERS"],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: ["ban"],
	run: async (client, message, args) => {
		if (!args[0]) return message.channel.send("Please provide a violation ID to stop ignoring")

		const report = await client.fagc.reports.fetchReport(args[0]).catch()
		if (!report?.id) return message.channel.send(`\`${args[0]}\` is an invalid violation ID`)
		const ignoration = await client.prisma.ignoredViolations.findFirst({ where: { violationId: report.id } })
		const embed = new MessageEmbed()
			.setTitle("FAGC Violation Ignoration")
			.setColor("ORANGE")
			.setDescription("FAGC Violation Ignoration removal")
			.setTimestamp()
			.setAuthor("oof2win2")
			.addFields([
				{ name: "Playername", value: report.playername, inline: true },
				{ name: "Admin ID", value: report.adminId, inline: true },
				{ name: "Community ID", value: report.communityId, inline: true },
				{ name: "Broken Rule", value: report.brokenRule, inline: true },
				{ name: "Automated", value: report.automated && "True" || "False", inline: true },
				{ name: "Proof", value: report.proof, inline: true },
				{ name: "Description", value: report.description, inline: true },
				{ name: "Report ID", value: report.id, inline: true },
				{ name: "Reported Time", value: `<t:${Math.round(report.reportedTime.valueOf()/1000)}>`, inline: true },
				{ name: "Ignored Since", value: `<t:${ignoration.whitelistedAt.valueOf()}>` },
				{ name: "Ignored By", value: `<@${ignoration.whitelistedBy}> | ${await client.users.fetch(ignoration.whitelistedBy).then(u => u?.tag)}` }
			])
		message.channel.send({ embeds: [embed] })
		const confirm = await getConfirmationMessage("Are you sure you want to stop ignoring this report?", message)
		if (!confirm) return message.channel.send("Report ignoration removal cancelled")

		const removed = await client.prisma.ignoredViolations.delete({ where: { violationId: report.id } })
		if (removed.violationId === report.id) return message.channel.send(`Report with ID \`${report.id}\` has been stopped from being ignored`)
		message.channel.send("An error has occured. Please check logs")
		throw removed
	}
}