import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Formatters } from "discord.js"

const ReportDetails: SubCommand<false, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("details")
		.setDescription("View details of a report")
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("The report to view")
				.setRequired(true)
		),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters }) => {
		const id = interaction.options.getString("id", true)

		const report = await client.fagc.reports.fetchReport({
			reportId: id,
		})

		if (!report)
			return interaction.reply(
				`${client.emotes.warn} Report with the ID \`${id}\` does not exist!`
			)

		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Report")
			.setDescription(`FAGC Report with ID \`${id}\``)

		embed.addFields([
			{
				name: "Admin",
				value: await client.safeGetContactString(report.adminId),
				inline: true,
			},
			{ name: "Category ID", value: report.categoryId, inline: true },
			{ name: "Community ID", value: report.communityId, inline: true },
			{
				name: "Automated",
				value: report.automated ? "Yes" : "No",
				inline: true,
			},
			{ name: "Description", value: report.description, inline: false },
			{ name: "Proof", value: report.proof, inline: false },
			{
				name: "Reported At",
				value: Formatters.time(report.reportedTime),
			},
			{
				name: "Report Created At",
				value: Formatters.time(report.reportCreatedAt),
			},
		])
		return interaction.reply({
			embeds: [embed],
		})
	},
}

export default ReportDetails
