import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBot from "./FAGCBot"
import { MessageEmbed } from "discord.js"
import { Prisma } from "@prisma/client"

interface HandlerOpts<T extends keyof WebSocketEvents> {
	event: Parameters<WebSocketEvents[T]>[0]
	client: FAGCBot
}

export const communityCreated = ({
	client,
	event,
}: HandlerOpts<"communityCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach(c => {
			const channel = client.channels.cache.get(c.channelID)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const communityRemoved = ({ client, event }: HandlerOpts<"communityRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach(c => {
			const channel = client.channels.cache.get(c.channelID)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const ruleCreated = ({ client, event }: HandlerOpts<"ruleCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach(c => {
			const channel = client.channels.cache.get(c.channelID)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const ruleRemoved = async ({ client, event }: HandlerOpts<"ruleRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach(c => {
			const channel = client.channels.cache.get(c.channelID)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const report = async ({ client, event }: HandlerOpts<"report">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	const guildIDs: string[] = []
	let createRecord = false
	client.infochannels.forEach((guildChannels, guildID) => {
		const guildConfig = client.guildConfigs.get(guildID)
		if (!guildConfig) return
		if (
			guildConfig.ruleFilters?.includes(event.report.brokenRule) &&
			guildConfig.trustedCommunities?.includes(event.report.communityId)
		) {
			createRecord = true
			guildChannels.forEach(c => {
				const channel = client.channels.cache.get(c.channelID)
				if (!channel || !channel.isNotDMChannel()) return
				client.addEmbedToQueue(channel.id, embed)
			})
			client.ban(event.report, guildConfig.guildId)
			guildIDs.push(guildID)
		}
	})
	if (createRecord) {
		await client.db.fAGCBans.create({
			data: {
				reportId: event.report.id,
				playername: event.report.playername,
				brokenRule: event.report.brokenRule,
				communityId: event.report.communityId,
				guildIDs: guildIDs.join(" ")
			}
		})

	}
}
export const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	const shouldRemoveAll = new Map<string, boolean>()
	await Promise.all(client.infochannels.map(async(guildChannels, guildID) => {
		const guildConfig = client.guildConfigs.get(guildID)
		if (!guildConfig) return
		if (
			guildConfig.ruleFilters?.includes(event.revocation.brokenRule) &&
			guildConfig.trustedCommunities?.includes(event.revocation.communityId)
		) {
			guildChannels.forEach(c => {
				const channel = client.channels.cache.get(c.channelID)
				if (!channel || !channel.isNotDMChannel()) return
				client.addEmbedToQueue(channel.id, embed)
			})
			await client.unban(event.revocation, guildID)

			const found = await client.db.fAGCBans.findFirst({
				where: {
					reportId: event.revocation.reportId
				}
			})
			if (found) {
				const newGuildIDs = found.guildIDs
					.split(" ")
					.filter(id => id !== guildID)
				// if no other guilds have the player banned, the ban can be safely removed
				if (!newGuildIDs.length) {
					await client.db.fAGCBans.delete({
						where: {
							reportId: event.revocation.reportId
						}
					})
				} else {
					await client.db.fAGCBans.update({
						where: {
							reportId: event.revocation.reportId,
						},
						data: {
							guildIDs: newGuildIDs.join(" ")
						}
					})
				}
			}

			// check for other bans and only if there are none, then the player gets unbanned
			const existing = await client.db.fAGCBans.findMany({
				where: {
					playername: event.revocation.playername,
					guildIDs: {
						contains: guildID
					}
				},
			})
			const privateBans = await client.db.privatebans.findMany({
				where: {
					playername: event.revocation.playername,
				}
			})
			if (existing.length) {
				// the report must exist here because it is still in the database
				const report = (await client.fagc.reports.fetchReport(existing[0].reportId))!
				client.ban(report, guildID)
			} else if (privateBans.length) {
				const command = `/ban ${event.revocation.playername} ${privateBans[0].reason}`
				await client.rcon.rconCommandGuild(command, guildID)
			}
		}
	}))
}

export const guildConfigChanged = async ({ client, event }: HandlerOpts<"guildConfigChanged">) => {
	client.guildConfigs.set(event.guildId, event)
	// remove bans that are now not filtered
	client.guildConfigs.forEach
}