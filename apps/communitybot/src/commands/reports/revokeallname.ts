import { EmbedField } from "discord.js"
import { AuthError } from "fagc-api-wrapper"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const RevokeAllName: Command = {
	name: "revokeallname",
	description: "Revokes all reports of a player in your community",
	aliases: [],
	category: "reports",
	usage: "[playername]",
	examples: ["revokeallname", "revokeallname Potato"],
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	async run({ client, message, args, guildConfig }) {
		if (!guildConfig.apikey)
			return message.reply(`${client.emotes.warn} No API key set`)

		// get playername
		const playername = await client.argsOrInput(args, message, `${client.emotes.type} Provide a player name to revoke reports of`)
		if (!playername)
			return message.channel.send(
				`${client.emotes.warn} No player name was provided`,
			)

		// get all their reports and display them on an embed
		const reports = await client.fagc.reports.search({
			playername: playername,
			communityId: guildConfig.communityId,
		})
		if (!reports.length) return message.channel.send(`${client.emotes.warn} No reports found for player ${playername} in your community`)

		const embed = client.createBaseEmbed()
			.setTitle("FAGC Report Revocation")
			.setDescription(`FAGC Reports of player \`${playername}\``)
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
		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to revoke all reports of this player?",
		)
		if (!confirm) return message.channel.send("Report revocation cancelled")

		try {
			await client.fagc.revocations.revokePlayer({
				playername: playername,
				adminId: message.author.id,
				reqConfig: {
					apikey: guildConfig.apikey,
				},
			})
			return message.channel.send("Reports revoked!")
		} catch (e) {
			if (e instanceof AuthError) {
				return message.channel.send(`${client.emotes.warn} Your API key is not recognized by FAGC`)
			}
			throw e
		}
	},
}

export default RevokeAllName
