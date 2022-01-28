import { Command } from "../../base/Command"

const FetchReport: Command = {
	name: "report",
	description: "Fetch a report by ID",
	category: "reports",
	usage: "[reportId]",
	aliases: [],
	examples: ["report FX07kpn"],
	requiresRoles: false,
	requiresApikey: false,
	async run({ message, args, client }) {
		const reportID = await client.argsOrInput(args, message, `${client.emotes.type} Provide a report ID to fetch`)
		if (!reportID)
			return message.channel.send(
				`${client.emotes.warn} No report ID was provided`,
			)

		const report = await client.fagc.reports.fetchReport({ reportId: reportID })
		if (!report)
			return message.channel.send(
				`${client.emotes.warn} Report with ID \`${reportID}\` doesn't exist`,
			)

		const embed = client.createBaseEmbed()
			.setTitle("FAGC Report")
			.setDescription(`FAGC Report with ID \`${reportID}\``)

		embed.addFields([
			{
				name: "Admin",
				value: await client.safeGetContactString(report.adminId),
				inline: true,
			},
			{ name: "Broken category ID", value: report.categoryId, inline: true },
			{ name: "Community ID", value: report.communityId, inline: true },
			{
				name: "Automated",
				value: report.automated ? "Yes" : "No",
				inline: true,
			},
			{ name: "Description", value: report.description, inline: false },
			{ name: "Proof", value: report.proof, inline: false },
			{
				name: "Reported At",
				value: `<t:${Math.round(report.reportedTime.valueOf() / 1000)}>`,
			},
			{
				name: "Report Created At",
				value: `<t:${Math.round(report.reportCreatedAt.valueOf() / 1000)}>`,
			},
		])
		return message.channel.send({
			embeds: [embed],
		})
	},
}
export default FetchReport
