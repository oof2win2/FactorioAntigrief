// const { MessageEmbed } = require("discord.js")
// const Command = require("../../base/Command")
// const { createPagedEmbed } = require("../../utils/functions")
// const { getMessageResponse } = require("../../utils/responseGetter")

import { EmbedField, MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import { getMessageResponse } from "../../utils/responseGetter"

// class GetReports extends Command {
// 	constructor(client) {
// 		super(client, {
// 			name: "reports",
// 			description:
// 				"Gets reports of a player from only trusted communities and filtered rules",
// 			aliases: [ "check", "viewreports", "viewfilteredreports" ],
// 			category: "reports",
// 			usage: "[playername]",
// 			examples: [ "{{p}}reports Windsinger" ],
// 			dirname: __dirname,
// 			enabled: true,
// 			memberPermissions: [],
// 			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
// 			ownerOnly: false,
// 			cooldown: 3000,
// 			requiredConfig: true,
// 		})
// 	}
// 	async run(message, args, config) {
// 		if (!args[0])
// 			args = await getMessageResponse(message, `${this.client.emotes.type} Provide a player name to get reports of`)
// 				.then((r) => r?.content?.split(" "))
// 		const playername = args.shift()
// 		if (!playername) return message.channel.send(`${this.client.emotes.warn} No player name was provided`)

// 		if (!config.trustedCommunities)
// 			return message.reply("No filtered communities set")
// 		if (!config.ruleFilters) return message.reply("No filtered rules set")
// 		const reports = await this.client.fagc.reports.fetchAllName({ playername: playername })
// 		const communities = await this.client.fagc.communities.fetchAll({})

// 		let embed = new MessageEmbed()
// 			.setTitle("FAGC Reports")
// 			.setColor("GREEN")
// 			.setTimestamp()
// 			.setAuthor("FAGC Community")
// 			.setDescription(`FAGC Reports of player \`${playername}\``)

// 		const trustedCommunities = communities.filter((community) => {
// 			if (
// 				config.trustedCommunities.some((trustedID) => {
// 					return trustedID === community.id
// 				})
// 			)
// 				return community
// 		})
// 		const filteredReports = reports
// 			.map((report) => {
// 				if (
// 					trustedCommunities.some(
// 						(community) => community.id === report.communityId
// 					) &&
// 					config.ruleFilters.includes(report.brokenRule)
// 				)
// 					return report
// 				return null
// 			})
// 			.filter((v) => v)

// 		if (!filteredReports.length)
// 			return message.channel.send(
// 				`Player \`${playername}\` doesn't have report that correspond to your rule and community preferences`
// 			)
// 		const fields = await Promise.all(
// 			filteredReports.map(async (report) => {
// 				const admin = await this.client.users.fetch(report.adminId)
// 				const rule = await this.client.fagc.rules.fetchRule({
// 					ruleid: report.brokenRule
// 				})
// 				const community =
// 					await this.client.fagc.communities.fetchCommunity({
// 						communityID: report.communityId
// 					})
// 				return {
// 					name: report.id,
// 					value:
// 						`By: <@${admin.id}> | ${admin.tag}\nCommunity ID: ${community.name} (${community.id})\n` +
// 						`Broken rule: ${rule.shortdesc} (${rule.id})\nProof: ${report.proof}\n` +
// 						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
// 						`Violated time: ${new Date(
// 							report.reportedTime
// 						).toUTCString()}`,
// 					inline: true,
// 				}
// 			})
// 		)
// 		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
// 	}
// }
// module.exports = GetReports

const GetReports: Command = {
	name: "reports",
	description:
		"Gets reports of a player from only trusted communities and filtered rules",
	aliases: ["check", "viewreports", "viewfilteredreports"],
	category: "reports",
	usage: "[playername]",
	examples: ["reports Potato"],
	requiresRoles: false,
	requiresApikey: false,
	async run({ client, message, args, guildConfig }) {
		if (!guildConfig.trustedCommunities)
			return message.reply("No filtered communities set")
		if (!guildConfig.ruleFilters) return message.reply("No filtered rules set")

		if (!args[0])
			args = await getMessageResponse(
				message,
				`${client.emotes.type} Provide a player name to get reports of`,
			).then((r) => r?.content?.split(" ") || [])
		const playername = args.shift()
		if (!playername)
			return message.channel.send(
				`${client.emotes.warn} No player name was provided`,
			)

		const embed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({ name: client.config.embeds.author })
			.setFooter({ text: client.config.embeds.footer })
			.setDescription(`FAGC Reports of player \`${playername}\``)

		const reports = await client.fagc.reports.list({
			playername: playername,
			communityIds: guildConfig.trustedCommunities,
			ruleIds: guildConfig.ruleFilters,
		})
		const fields: EmbedField[] = await Promise.all(
			reports.map(async (report) => {
				const admin = await client.users.fetch(report.adminId).catch(() => null)
				return {
					name: report.id,
					value:
						`By: <@${report.adminId}> | ${admin?.tag}\nCommunity ID: ${report.communityId}\n` +
						`Broken rule: ${report.brokenRule}\nProof: ${report.proof}\n` +
						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
						`Reported at: <t:${Math.round(
							report.reportedTime.valueOf() / 1000,
						)}>\n` +
						`Report created at: <t:${Math.round(
							report.reportCreatedAt.valueOf() / 1000,
						)}>`,
					inline: true,
				}
			}),
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	},
}
export default GetReports
