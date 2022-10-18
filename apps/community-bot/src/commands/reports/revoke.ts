import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Formatters } from "discord.js"
import { createPagedEmbed } from "../../utils/functions"
import validator from "validator"
import { AuthError } from "fagc-api-wrapper"

const Create: SubCommand<true, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("revoke")
		.setDescription("Revoke a FAGC report by it's ID")
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("ID of the report to revoke")
				.setRequired(true)
		),
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	fetchFilters: true,
	execute: async ({ interaction, client, filters, guildConfig }) => {
		const id = interaction.options.getString("id", true)

		const report = await client.fagc.reports.fetchReport({ reportId: id })
		if (!report) {
			return interaction.reply({
				content: `Report with ID \`${id}\` does not exist!`,
			})
		}
		if (report.communityId !== guildConfig.communityId) {
			return interaction.reply({
				content: `Report with ID \`${id}\` does not belong to your community!`,
			})
		}

		const admin = await client.safeGetContactString(report.adminId)

		const checkEmbed = client
			.createBaseEmbed()
			.setTitle("FAGC Report Revocation")
			.setDescription(
				`FAGC Report \`${report.id}\` of player \`${report.playername}\``
			)
			.addFields([
				{
					name: "Admin",
					value: admin,
				},
				{ name: "Category ID", value: report.categoryId },
				{ name: "Description", value: report.description },
				{ name: "Proof", value: report.proof },
				{
					name: "Automated",
					value: report.automated ? "True" : "False",
				},
				{
					name: "Reported At",
					value: Formatters.time(report.reportedTime),
				},
				{
					name: "Report Created At",
					value: Formatters.time(report.reportCreatedAt),
				},
			])
		await interaction.reply({ embeds: [checkEmbed] })
		const confirm = await client.getConfirmation(
			interaction,
			"Are you sure you want to revoke this report?",
			interaction.user,
			{ followUp: true }
		)
		if (!confirm) return interaction.followUp("Report revocation cancelled")

		try {
			await client.fagc.revocations.revoke({
				reportId: id,
				adminId: interaction.user.id,
				reqConfig: { apikey: guildConfig.apikey },
			})

			return interaction.followUp("Report revoked!")
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.followUp(
					`${client.emotes.warn} Your API key is not recognized by FAGC`
				)
			}
			throw e
		}
	},
}

export default Create
