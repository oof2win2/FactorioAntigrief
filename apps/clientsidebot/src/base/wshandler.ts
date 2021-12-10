import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import { GuildConfig } from "fagc-api-types"
import FAGCBot from "./FAGCBot"
import { ActionType } from "./database"
import { MessageEmbed } from "discord.js"

interface HandlerOpts<T extends keyof WebSocketEvents> {
	event: Parameters<WebSocketEvents[T]>[0]
	client: FAGCBot
}

export const communityCreated = ({
	event,
	client,
}: HandlerOpts<"communityCreated">) => {
	
}

export const communityRemoved = ({ event }: HandlerOpts<"communityRemoved">) => {

}

export const report = ({ client, event }: HandlerOpts<"report">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	client.infochannels.forEach((guildChannels) => {
		const guildConfig = client.guildConfigs.get(guildChannels[0].guildID)
		if (!guildConfig) return
		if (
			guildConfig.ruleFilters?.includes(event.report.brokenRule) &&
			guildConfig.trustedCommunities?.includes(event.report.communityId)
		) {
			guildChannels.forEach(c => {
				const channel = client.channels.cache.get(c.channelID)
				if (!channel || !channel.isNotDMChannel()) return
				client.addEmbedToQueue(channel.id, embed)
			})
		}

	})
}
export const revocation = ({ client, event }: HandlerOpts<"revocation">) => {
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