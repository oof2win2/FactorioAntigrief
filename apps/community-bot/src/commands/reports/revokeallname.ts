import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { EmbedField, Formatters } from "discord.js"
import { createPagedEmbed } from "../../utils/functions"
import { AuthError } from "@fdgl/wrapper"

const Create: SubCommand<true, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("revokeallname")
		.setDescription("Revoke all reports by playername")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Name of the player to revoke all reports of")
				.setRequired(true)
		),
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	fetchFilters: true,
	execute: async ({ interaction, client, filters, guildConfig }) => {
		const playername = interaction.options.getString("playername", true)

		const reports = await client.fdgl.reports.search({
			playername: playername,
			communityId: guildConfig.communityId,
		})

		if (!reports.length)
			return interaction.reply(
				`${client.emotes.warn} No reports found for player ${playername} in your community`
			)

		const embed = client
			.createBaseEmbed()
			.setTitle("FDGL Report Revocation")
			.setDescription(`FDGL Reports of player \`${playername}\``)
		const fields: EmbedField[] = await Promise.all(
			reports.map(async (report) => {
				const admin = await client.users
					.fetch(report.adminId)
					.catch(() => null)
				return {
					name: report.id,
					value:
						`By: <@${report.adminId}> | ${admin?.tag}\nCommunity ID: ${report.communityId}\n` +
						`Category: ${report.categoryId}\nProof: ${report.proof}\n` +
						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
						`Reported at: ${Formatters.time(
							report.reportedTime
						)}\n` +
						`Report created at: ${Formatters.time(
							report.reportCreatedAt
						)}`,
					inline: true,
				}
			})
		)
		await createPagedEmbed(fields, embed, interaction, interaction.user, {
			maxPageCount: 5,
		})

		const confirm = await client.getConfirmation(
			interaction,
			"Are you sure you want to revoke all reports of this player?",
			interaction.user,
			{ followUp: true }
		)
		if (!confirm) return interaction.followUp("Report revocation cancelled")

		try {
			await client.fdgl.revocations.revokePlayer({
				playername: playername,
				adminId: interaction.user.id,
				reqConfig: {
					apikey: guildConfig.apikey,
				},
			})
			return interaction.followUp("Reports revoked!")
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.followUp(
					`${client.emotes.warn} Your API key is not recognized by FDGL`
				)
			}
			throw e
		}
	},
}

export default Create
