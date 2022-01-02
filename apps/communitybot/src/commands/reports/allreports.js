const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")
const { getMessageResponse } = require("../../utils/responseGetter")

class GetAllReports extends Command {
	constructor(client) {
		super(client, {
			name: "allreports",
			description: "Gets all reports of a player",
			aliases: [ "checkall", "viewallreports" ],
			category: "reports",
			usage: "[playername]",
			examples: [ "{{p}}allreports Windsinger" ],
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message, args) {
		if (!args[0])
			args[0] = await getMessageResponse(message, `${this.client.emotes.type} Provide a player name to get profiles of`)
				.then((r) => r?.content?.split(" ")[0])
		const playername = args.shift()
		if (!playername) return message.channel.send(`${this.client.emotes.warn} No player name was provided`)
		
		const reports = await this.client.fagc.reports.fetchAllName({ playername: playername })
		if (!reports[0])
			return message.reply(
				`Player \`${playername}\` doesn't have any reports`
			)
		let embed = new MessageEmbed()
			.setTitle("FAGC Reports")
			.setColor("ORANGE")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Reports of player \`${playername}\``)

		const fields = await Promise.all(
			reports.map(async (report) => {
				const admin = await this.client.users.fetch(report.adminId)
				const rule = await this.client.fagc.rules.fetchRule({
					ruleid: report.brokenRule
				})
				const community =
					await this.client.fagc.communities.fetchCommunity({
						communityID: report.communityId
					})

				return {
					name: report.id,
					value:
						`By: <@${admin.id}> | ${admin.tag}\nCommunity ID: ${community?.name} (${community?.id})\n` +
						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
						`Broken rule: ${rule?.shortdesc} (${rule?.id})\nProof: ${report.proof}\n` +
						`Violated time: <t:${Math.floor(
							report.reportedTime.valueOf() / 1000
						)}>`,
					inline: true,
				}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	}
}
module.exports = GetAllReports
