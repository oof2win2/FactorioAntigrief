const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetAllReports extends Command {
	constructor(client) {
		super(client, {
			name: "fetchreport",
			description: "Fetch a report by ID",
			aliases: [],
			category: "reports",
			usage: "[reportId]",
			examples: ["{{p}}fetchreport FX07kpn"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false
		})
	}
	async run (message, args) {
		if (!args[0]) return message.reply("Provide a report to fetch")
		const reportID = args[0]
		
		const report = await this.client.fagc.reports.fetchReport(reportID)
		if (!report?.id)
			return message.channel.send(`Report with ID \`${reportID}\` doesn't exist`)
		if (report.error && report.description.includes("id expected ID"))
			return message.reply(`\`${reportID}\` is not a proper report ID`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Report Revocation")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Report with ID \`${reportID}\``)
		const creator = await this.client.users.fetch(report.adminId)
		embed.addFields(
			{ name: "Admin", value: `<@${creator.id}> | ${creator.tag}` },
			{ name: "Broken rule ID", value: report.brokenRule },
			{ name: "Proof", value: report.proof },
			{ name: "Description", value: report.description },
			{ name: "Automated", value: report.automated },
			{ name: "Violated time", value: `<t:${Math.floor(report.reportedTime.valueOf()/1000)}>` }
		)
		return message.channel.send(embed)
	}
}
module.exports = GetAllReports
