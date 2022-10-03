import { Formatters } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const AllReports = Command({
	name: "allreports",
	description: "Gets all reports of a player",
	aliases: ["checkall", "viewallreports"],
	category: "reports",
	usage: "[playername]",
	examples: ["allreports Windsinger"],
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	run: async ({ client, message, args }) => {
		// if a playername is not provided as an arg, prompt the user to provide one
		const playername = await client.argsOrInput(
			args,
			message,
			`${client.emotes.type} Provide a player name to get reports of`
		)
		if (!playername)
			return message.channel.send(
				`${client.emotes.warn} No player name was provided`
			)

		const reports = await client.fagc.reports.search({
			playername: playername,
		})
		if (!reports[0])
			return message.channel.send(
				`Player \`${playername}\` doesn't have any reports`
			)
		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Reports")
			.setDescription(`FAGC Reports of player \`${playername}\``)
		const fields = await Promise.all(
			reports.map(async (report) => {
				const category = await client.fagc.categories.fetchCategory({
					categoryId: report.categoryId,
				})
				const community = await client.fagc.communities.fetchCommunity({
					communityId: report.communityId,
				})

				return {
					name: report.id,
					value:
						`By: ${await client.safeGetContactString(
							report.adminId
						)}\nCommunity ID: ${community?.name} (${community?.id
						})\n` +
						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
						`Category: ${category?.name} (${category?.id})\nProof: ${report.proof}\n` +
						`Violated time: ${Formatters.time(
							report.reportedTime
						)}`,
					inline: true,
				}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	},
})

export default AllReports
