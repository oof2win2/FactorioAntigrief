// const { MessageEmbed } = require("discord.js")
// const Command = require("../../base/Command")
// const { getMessageResponse } = require("../../utils/responseGetter")

import { MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { getMessageResponse } from "../../utils/responseGetter";

// class FetchReport extends Command {
// 	constructor(client) {
// 		super(client, {
// 			name: "report",
// 			description: "Fetch a report by ID",
// 			category: "reports",
// 			usage: "[reportId]",
// 			examples: [ "{{p}}report FX07kpn" ],
// 			dirname: __dirname,
// 			enabled: true,
// 			memberPermissions: [],
// 			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
// 			ownerOnly: false,
// 			cooldown: 3000,
// 			requiredConfig: false,
// 		})
// 	}
// 	async run(message, args) {
// 		if (!args[0])
// 			args = await getMessageResponse(message, `${this.client.emotes.type} Provide a report to fetch`)
// 				.then((r) => r?.content?.split(" "))
// 		const reportID = args.shift()?.toLowerCase()
// 		if (!reportID) return message.channel.send(`${this.client.emotes.warn} No report was provided`)

// 		const report = await this.client.fagc.reports.fetchReport({ id: reportID })
// 		if (!report?.id)
// 			return message.channel.send(
// 				`${this.client.emotes.warn} Report with ID \`${reportID}\` doesn't exist`
// 			)
// 		if (report.error && report.description.includes("id expected ID"))
// 			return message.reply(`${this.client.emotes.warn} \`${reportID}\` is not a proper report ID`)

// 		let embed = new MessageEmbed()
// 			.setTitle("FAGC Report")
// 			.setColor("GREEN")
// 			.setTimestamp()
// 			.setAuthor("FAGC Community")
// 			.setDescription(`FAGC Report with ID \`${reportID}\``)
// 		const creator = await this.client.users.fetch(report.adminId)
// 		embed.addFields(
// 			{ name: "Admin", value: `<@${creator.id}> | ${creator.tag}` },
// 			{ name: "Broken rule ID", value: report.brokenRule },
// 			{ name: "Proof", value: report.proof },
// 			{ name: "Description", value: report.description },
// 			{ name: "Automated", value: report.automated },
// 			{
// 				name: "Violated time",
// 				value: `<t:${Math.floor(
// 					report.reportedTime.valueOf() / 1000
// 				)}>`,
// 			}
// 		)
// 		return message.channel.send(embed)
// 	}
// }
// module.exports = FetchReport


const FetchReport: Command = {
	name: "report",
	description: "Fetch a report by ID",
	category: "reports",
	usage: "[reportId]",
	aliases: [],
	examples: [ "report FX07kpn" ],
	requiresRoles: false,
	requiresApikey: false,
	async run({ message, args, client}) {
		const reportID = args.shift() || await getMessageResponse(message, `${client.emotes.type} Provide a report ID to fetch`).then((x) => x?.content?.split(" ")[0])
		if (!reportID) return message.channel.send(`${client.emotes.warn} No report ID was provided`)

		const report = await client.fagc.reports.fetchReport({ reportId: reportID })
		if (!report) return message.channel.send(`${client.emotes.warn} Report with ID \`${reportID}\` doesn't exist`)

		const embed = new MessageEmbed()
			.setTitle("FAGC Report")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({name: client.config.embeds.author})
			.setFooter({text: client.config.embeds.footer})
			.setDescription(`FAGC Report with ID \`${reportID}\``)
		
		const creator = await client.users.fetch(report.adminId).catch(() => null)
		embed.addFields([
			{ name: "Admin", value: `<@${creator?.id}> | ${creator?.tag}` , inline: true},
			{ name: "Broken rule ID", value: report.brokenRule , inline: true},
			{name: "Community ID", value: report.communityId, inline: true},
			{ name: "Automated", value: report.automated ? "Yes" : "No" , inline: true},
			{ name: "Description", value: report.description , inline: false},
			{ name: "Proof", value: report.proof , inline: false},
		])
		return message.channel.send({
			embeds: [embed],
		})
	}
}
export default FetchReport