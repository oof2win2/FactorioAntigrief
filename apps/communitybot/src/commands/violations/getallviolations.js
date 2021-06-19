const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetAllReports extends Command {
	constructor(client) {
		super(client, {
			name: "getallreports",
			description: "Gets all reports of a player",
			aliases: ["checkall"],
			category: "reportss",
			usage: "[playername]",
			examples: ["{{p}}getallreports Windsinger"],
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
		if (!args[0]) return message.reply("Provide a player name to get reports of")
		const reports = await this.client.fagc.violations.fetchAllName(args[0])
		if (!reports[0])
			return message.reply(`Player \`${args[0]}\` doesn't have any reports`)
		let embed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("ORANGE")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Reports of player \`${args[0]}\``)
		
		const fields = await Promise.all(reports.map(async (report) => {
			const admin = await this.client.users.fetch(report.adminId)
			const rule = await this.client.getOrFetchRule(report.brokenRule)
			const community = await this.client.getOrFetchCommunity(report.communityId)
			return {
				name: report.id,
				value: 	`By: <@${admin.id}> | ${admin.tag}\nCommunity ID: ${community.name} (${community.id})\n` +
						`Broken rule: ${rule.shortdesc} (${rule.id})\nProof: ${report.proof}\n` +
						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
						`Violated time: ${(new Date(report.reportedTime)).toUTCString()}`,
				inline: true
			}
		}))
		createPagedEmbed(fields, embed, message, {maxPageCount: 5})
	}
}
module.exports = GetAllReports
