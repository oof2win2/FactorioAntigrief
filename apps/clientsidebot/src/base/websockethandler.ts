import FAGCBot from "./fagcbot.js"

import { MessageEmbed, TextChannel } from "discord.js"
import { HandleUnfilteredViolation, HandleUnfilteredRevocation } from "./FAGCHandler.js"
import { CommunityConfig, ReportCreatedMessage, RevocationMessage, RuleCreatedMessage, RuleRemovedMessage } from "fagc-api-types"

export function GuildConfigHandler(config: CommunityConfig): void {
	FAGCBot.fagcconfig = {
		...FAGCBot.fagcconfig,
		...config,
	}
	return
}

export async function ReportHandler(ReportMessage: ReportCreatedMessage, client: FAGCBot, channels: TextChannel[]): Promise<void> {
	const embed = new MessageEmbed({...ReportMessage.embed, timestamp: new Date(ReportMessage.embed.timestamp  || Date.now())})
	const handled = await HandleUnfilteredViolation(ReportMessage.report, client)
	embed.addField("Handled with an action", handled ? "Yes" : "No")
	channels.forEach(channel => channel.send({embeds: [embed]}))
}
export async function RevocationHandler(RevocationMessage: RevocationMessage, client: FAGCBot, channels: TextChannel[]): Promise<void> {
	const embed = new MessageEmbed({...RevocationMessage.embed, timestamp: new Date(RevocationMessage.embed.timestamp || Date.now())})
	const handled = await HandleUnfilteredRevocation(RevocationMessage.revocation, client)
	embed.addField("Handled with an action", handled ? "Yes" : "No")
	channels.forEach(channel => channel.send({embeds: [embed]}))
}

export function RuleCreatedHandler(RuleCreatedMessage: RuleCreatedMessage, client: FAGCBot, channels: TextChannel[]): void {
	const embed = new MessageEmbed({...RuleCreatedMessage.embed, timestamp: new Date(RuleCreatedMessage.embed.timestamp || Date.now())})
	channels.forEach(channel => channel.send({embeds: [embed]}))
}

export function RuleRemovedHandler(message: RuleRemovedMessage, client: FAGCBot, channels: TextChannel[]): void {
	const embed = new MessageEmbed({...message.embed, timestamp: new Date(message.embed.timestamp || Date.now())})
	channels.forEach(channel => channel.send({embeds: [embed]}))
}