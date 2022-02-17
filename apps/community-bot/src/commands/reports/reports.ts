import { EmbedField } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const GetReports: Command = {
	name: "reports",
	description:
		"Gets reports of a player from only trusted communities and filtered categories",
	aliases: [ "check", "viewreports", "viewfilteredreports" ],
	category: "reports",
	usage: "[playername]",
	examples: [ "reports Potato" ],
	requiresRoles: false,
	requiresApikey: false,
	async run({ client, message, args, guildConfig }) {
		if (!guildConfig.trustedCommunities)
			return message.reply("No filtered communities set")
		if (!guildConfig.categoryFilters) return message.reply("No filtered categories set")

		const playername = await client.argsOrInput(args, message, `${client.emotes.type} Type in the player name`)
		if (!playername)
			return message.channel.send(
				`${client.emotes.warn} No player name was provided`,
			)

		const embed = client.createBaseEmbed()
			.setTitle("FAGC Reports")
			.setDescription(`FAGC Reports of player \`${playername}\``)

		const reports = await client.fagc.reports.list({
			playername: playername,
			communityIds: guildConfig.trustedCommunities,
			categoryIds: guildConfig.categoryFilters,
		})
		const fields: EmbedField[] = await Promise.all(
			reports.map(async (report) => {
				const admin = await client.users.fetch(report.adminId).catch(() => null)
				return {
					name: report.id,
					value:
						`By: <@${report.adminId}> | ${admin?.tag}\nCommunity ID: ${report.communityId}\n` +
						`Category: ${report.categoryId}\nProof: ${report.proof}\n` +
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
