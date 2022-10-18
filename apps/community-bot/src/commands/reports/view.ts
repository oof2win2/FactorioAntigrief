import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Formatters } from "discord.js"
import { createPagedEmbed } from "../../utils/functions"

const View: SubCommand<false, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("View filtered FAGC reports of a player")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Playername to check")
				.setRequired(true)
		),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters }) => {
		const playername = interaction.options.getString("playername", true)
		const reports = await client.fagc.reports.fetchAllName({ playername })
		const filteredReports = reports.filter((report) => {
			if (!filters.categoryFilters.includes(report.categoryId))
				return false
			if (!filters.communityFilters.includes(report.communityId))
				return false
			return true
		})
		if (filteredReports.length === 0) {
			await interaction.reply(
				`No matching reports found for player ${playername}`
			)
			return
		}

		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Reports")
			.setDescription(`All FAGC Reports of ${playername}`)

		const fields = await Promise.all(
			filteredReports.map(async (report) => {
				const community = await client.fagc.communities.fetchCommunity({
					communityId: report.communityId,
				})
				const category = await client.fagc.categories.fetchCategory({
					categoryId: report.categoryId,
				})

				return {
					name: `**${report.id}**`,
					value: [
						`By: ${await client.safeGetContactString(
							report.adminId
						)}`,
						`Community ID: ${community?.name} (${report.communityId})`,
						`Description: ${report.description}`,
						`Automated: ${report.automated ? "Yes" : "No"}`,
						`Category: ${category?.name} (${report.categoryId})`,
						`Proof: ${report.proof}`,
						`Violated time: ${Formatters.time(
							report.reportedTime
						)}`,
					].join("\n"),
					inline: true,
				}
			})
		)

		createPagedEmbed(fields, embed, interaction, interaction.user, {
			maxPageCount: 5,
		})
	},
}

export default View
