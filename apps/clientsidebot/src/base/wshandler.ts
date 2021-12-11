import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBot from "./FAGCBot"
import { MessageEmbed } from "discord.js"

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
		}
	})
	if (createRecord) {
		await client.db.fAGCBans.create({
			data: {
				reportId: event.report.id,
				playername: event.report.playername,
				brokenRule: event.report.brokenRule,
				communityId: event.report.communityId
			}
		})

	}
}
export const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	client.infochannels.forEach((guildChannels) => {
		const guildConfig = client.guildConfigs.get(guildChannels[0].guildID)
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
		}
	})
}

export const guildConfigChanged = async ({ client, event }: HandlerOpts<"guildConfigChanged">) => {
	client.guildConfigs.set(event.guildId, event)
	// remove bans that are now not filtered
}