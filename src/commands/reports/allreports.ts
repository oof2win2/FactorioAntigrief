import { MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import { getMessageResponse } from "../../utils/responseGetter"

const AllReports: Command = {
	name: "allreports",
	description: "Gets all reports of a player",
	aliases: ["checkall", "viewallreports"],
	category: "reports",
	usage: "[playername]",
	examples: ["allreports Windsinger"],
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ client, message, args }) => {
		// if a playername is not provided as an arg, prompt the user to provide one
		if (!args[0])
			args = await getMessageResponse(
				message,
				`${client.emotes.type} Provide a player name to get reports of`,
			).then((x) => x?.content?.split(" ") || [])

		const playername = args.shift()
		if (!playername)
			return message.channel.send(
				`${client.emotes.warn} No player name was provided`,
			)

		const reports = await client.fagc.reports.search({ playername: playername })
		if (!reports[0])
			return message.channel.send(
				`Player \`${playername}\` doesn't have any reports`,
			)
		console.log(reports.length)
		const embed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("ORANGE")
			.setTimestamp()
			.setAuthor({ name: client.config.embeds.author })
			.setFooter({ text: client.config.embeds.footer })
			.setDescription(`FAGC Reports of player \`${playername}\``)
		const fields = await Promise.all(
			reports.map(async (report) => {
				const rule = await client.fagc.rules.fetchRule({
					ruleid: report.brokenRule,
				})
				const community = await client.fagc.communities.fetchCommunity({
					communityId: report.communityId,
				})
				return {
					name: report.id,
					value:
						`By: ${await client.safeGetContactString(report.adminId)}\nCommunity ID: ${community?.name} (${community?.id})\n` +
						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
						`Broken rule: ${rule?.shortdesc} (${rule?.id})\nProof: ${report.proof}\n` +
						`Violated time: <t:${Math.floor(
							report.reportedTime.valueOf() / 1000,
						)}>`,
					inline: true,
				}
			}),
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	},
}

export default AllReports
