import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBot from "./FAGCBot"
import { Report } from "fagc-api-types"
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
	client.infochannels.forEach((guildChannels, guildID) => {
		const guildConfig = client.guildConfigs.get(guildID)
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
			client.ban(event.report, guildConfig.guildId)
		}
	})
}
export const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
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
			
			
			const privateBans = await client.db.privatebans.findMany({
				where: {
					playername: event.revocation.playername,
				}
			})
			if (privateBans.length) {
				const command = `/ban ${event.revocation.playername} ${privateBans[0].reason}`
				await client.rcon.rconCommandGuild(command, guildID)
			} else {
				const otherBans = await client.fagc.reports.listFiltered(
					guildConfig.ruleFilters ?? [],
					guildConfig.trustedCommunities ?? []
				)
				if (otherBans.length) client.ban(otherBans[0], guildID)
			}
		}
	}))
}

export const guildConfigChanged = async ({ client, event }: HandlerOpts<"guildConfigChanged">) => {
	const oldConfig = client.guildConfigs.get(event.guildId)

	if (
		oldConfig && oldConfig.ruleFilters && oldConfig.trustedCommunities &&
		event.ruleFilters && event.trustedCommunities
	) {
		const oldReports = await client.fagc.reports.listFiltered(oldConfig.ruleFilters, oldConfig.trustedCommunities)
		const newReports = await client.fagc.reports.listFiltered(event.ruleFilters, event.trustedCommunities)

		const oldReportNames = oldReports.map(report => report.playername)
		const newReportNames = newReports.map(report => report.playername)
		const unbanPlayers = oldReportNames
			.filter((playername) => !newReportNames.includes(playername))
		const newBans = newReportNames
			.map((playername) => {
				if (!oldReportNames.includes(playername)) {
					const report = newReports.find(report => report.playername === playername)!
					return report
				}
				return false
			})
			.filter((r): r is Report => Boolean(r))
		
		// TODO: custom ban+unban messages
		const unbanCommand = unbanPlayers
			.map((playername) => `game.unban_player("${playername}")`)
			.join(";")
		const banCommand = newBans
			.map((report) => `game.ban_player("${report.playername}")`)
			.join(";")
		await client.rcon.rconCommandGuild(`/sc ${unbanCommand}`, event.guildId)
		await client.rcon.rconCommandGuild(`/sc ${banCommand}` , event.guildId)
	}

	client.guildConfigs.set(event.guildId, event)

	await client.syncCommandPerms(event.guildId)
}