import { AuthError } from "fagc-api-wrapper"
import { Command } from "../../base/Command"

const RevokeReport: Command = {
	name: "revoke",
	description: "Revokes a player's report with the report ID",
	aliases: ["revokeid"],
	category: "reports",
	usage: "[reportid]",
	examples: ["revoke p1UgG0G"],
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	async run({ message, args, guildConfig, client }) {
		if (!guildConfig.apiKey)
			return message.reply(`${client.emotes.warn} No API key set`)
		const id = await client.argsOrInput(args, message, `${client.emotes.type} Provide a report ID to revoke`)
		if (!id)
			return message.channel.send(
				`${client.emotes.warn} No report ID was provided`,
			)

		const report = await client.fagc.reports.fetchReport({ reportId: id })
		if (!report)
			return message.channel.send(
				`${client.emotes.warn} Report with ID \`${id}\` doesn't exist`,
			)

		if (report.communityId !== guildConfig.communityId)
			return message.channel.send(
				`You are trying to revoke a report of community \`${report.communityId}\`, but you are from community \`${guildConfig.communityId}\``,
			)

		const adminUser = await client.users.fetch(report.adminId).catch(() => null)
		const embed = client.createBaseEmbed()
			.setTitle("FAGC Report Revocation")
			.setDescription(
				`FAGC Report \`${report.id}\` of player \`${report.playername}\``,
			)
			.addFields([
				{
					name: "Admin",
					value: `<@${report.adminId}> | ${adminUser?.tag ?? "Unknown"}`,
				},
				{ name: "Broken category ID", value: report.categoryId },
				{ name: "Description", value: report.description },
				{ name: "Proof", value: report.proof },
				{ name: "Automated", value: report.automated ? "True" : "False" },
				{
					name: "Reported At",
					value: `<t:${Math.round(report.reportedTime.valueOf() / 1000)}>`,
				},
				{
					name: "Report Created At",
					value: `<t:${Math.round(report.reportCreatedAt.valueOf() / 1000)}>`,
				},
			])
		message.channel.send({
			embeds: [embed],
		})
		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to revoke this report?",
		)
		if (!confirm) return message.channel.send("Report revocation cancelled")
		
		try {
			await client.fagc.revocations.revoke({
				reportId: id,
				adminId: message.author.id,
				reqConfig: { apikey: guildConfig.apiKey },
			})

			return message.channel.send("Report revoked!")
		} catch (e) {
			if (e instanceof AuthError) {
				return message.channel.send(`${client.emotes.warn} Your API key is not recognized by FAGC`)
			}
			throw e
		}
	},
}

export default RevokeReport
