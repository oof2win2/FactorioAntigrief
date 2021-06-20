import FAGCBot from "./fagcbot"

import { MessageEmbed, TextChannel } from "discord.js"
import { HandleUnfilteredViolation, HandleUnfilteredRevocation } from "./FAGCHandler"
import { CommunityConfig, Report, Revocation, Rule } from "fagc-api-wrapper"

export function GuildConfigHandler(config: CommunityConfig): void {
	FAGCBot.fagcconfig = {
		...FAGCBot.fagcconfig,
		...config,
	}
	return
}

export async function ReportHandler(report: Report, client: FAGCBot, channels: TextChannel[]): Promise<void> {
	const embed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setColor("ORANGE")
		.setDescription("FAGC Report has been created")
		.setTimestamp()
		.setAuthor("oof2win2")
		.addFields(
			{ name: "Playername", value: report.playername },
			{ name: "Admin ID", value: report.adminId },
			{ name: "Community ID", value: report.communityId },
			{ name: "Broken Rule", value: report.brokenRule },
			{ name: "Automated", value: report.automated },
			{ name: "Proof", value: report.proof },
			{ name: "Description", value: report.description },
			{ name: "Report ID", value: report.id },
			{ name: "Reported Time", value: report.reportedTime }
		)
	const handled = await HandleUnfilteredViolation(report)
	embed.addField("Handled with an action", handled ? "Yes" : "No")
	channels.forEach(channel => channel.send(embed))
}
export async function RevocationHandler(revocation: Revocation, client: FAGCBot, channels: TextChannel[]): Promise<void> {
	const embed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setColor("ORANGE")
		.setDescription("FAGC Report has been revoked")
		.setTimestamp()
		.setAuthor("oof2win2")
		.addFields(
			{ name: "Playername", value: revocation.playername },
			{ name: "Admin ID", value: revocation.adminId },
			{ name: "Community ID", value: revocation.communityId },
			{ name: "Broken Rules", value: revocation.brokenRule },
			{ name: "Automated", value: revocation.automated },
			{ name: "Proof", value: revocation.proof },
			{ name: "Description", value: revocation.description },
			{ name: "Revocation ID", value: revocation.id },
			{ name: "Revocation Time", value: revocation.revokedTime },
			{ name: "Revoked by", value: revocation.revokedBy },
		)
	const handled = await HandleUnfilteredRevocation(revocation, client)
	embed.addField("Handled with an action", handled ? "Yes" : "No")
	channels.forEach(channel => channel.send(embed))
}

export function RuleCreatedHandler(rule: Rule, client: FAGCBot, channels: TextChannel[]): void {
	const embed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Rule created")
		.setColor("ORANGE")
		.addFields(
			{ name: "Rule short description", value: rule.shortdesc },
			{ name: "Rule long description", value: rule.longdesc }
		)
	channels.forEach(channel => channel.send(embed))
}

export function RuleRemovedHandler(message: Rule, client: FAGCBot, channels: TextChannel[]): void {
	const embed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Rule removed")
		.setColor("ORANGE")
		.addFields(
			{ name: "Rule short description", value: message.shortdesc },
			{ name: "Rule long description", value: message.longdesc }
		)
	channels.forEach(channel => channel.send(embed))
}