import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Formatters } from "discord.js"
import { createPagedEmbed } from "../../utils/functions"

const GenerateBanlist: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("List all FDGL reports of a player")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Playername to check")
				.setRequired(true)
		),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client }) => {
		const playername = interaction.options.getString("playername", true)
		const reports = await client.fdgl.reports.fetchAllName({ playername })
		if (reports.length === 0) {
			await interaction.reply(`No reports found for player ${playername}`)
			return
		}

		const embed = client
			.createBaseEmbed()
			.setTitle("FDGL Reports")
			.setDescription(`All FDGL Reports of ${playername}`)

		const fields = await Promise.all(
			reports.map(async (report) => {
				const community = await client.fdgl.communities.fetchCommunity({
					communityId: report.communityId,
				})
				const category = await client.fdgl.categories.fetchCategory({
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

export default GenerateBanlist
