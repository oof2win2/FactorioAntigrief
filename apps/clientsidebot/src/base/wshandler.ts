import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBot from "./FAGCBot"
import { MessageEmbed } from "discord.js"
import { GuildConfig, Report, Revocation } from "fagc-api-types"

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

	let shouldPerformActions = false
	const guildConfigs: GuildConfig[] = []

	client.guilds.cache.forEach((guild) => {
		const guildConfig = client.guildConfigs.get(guild.id)
		if (!guildConfig) return
		const infochannels = client.infochannels.get(guild.id)
		if (
			guildConfig.ruleFilters?.includes(event.report.brokenRule) &&
			guildConfig.trustedCommunities?.includes(event.report.communityId)
		) {
			if (infochannels) {
				infochannels.forEach(c => {
					const channel = client.channels.cache.get(c.channelID)
					if (!channel || !channel.isNotDMChannel()) return
					client.addEmbedToQueue(channel.id, embed)
				})
			}
			shouldPerformActions = true
			guildConfigs.push(guildConfig)
		}
	})

	if (!shouldPerformActions) return // did not match any filters so return
	
	reportHandler(client, guildConfigs, event.report)
}
/**
 * @param guildConfigs array of guild configs that are affected by the revocation, i.e. it matches their community and rule filters
 */
const reportHandler = async (client: FAGCBot, guildConfigs: GuildConfig[], report: Report) => {
	const isWhitelisted = await client.db.whitelist.findFirst({
		where: {
			playername: report.playername
		}
	})
	if (isWhitelisted) return // if the player is whitelisted, don't do anything

	// create the record for future safekeeping
	await client.db.fagcBan.create({
		data: {
			id: report.id,
			playername: report.playername,
			brokenRule: report.brokenRule,
			communityID: report.communityId,
		}
	})

	// ban in guilds that its supposed to
	guildConfigs.map((guildConfig) => {
		const reason = client.createBanCommand(report, guildConfig.guildId)
		if (!reason) return // if it is not supposed to do anything in this guild, then it won't do anything
		// TODO: put in the reason properly when this is resolved https://forums.factorio.com/viewtopic.php?f=7&t=101053
		client.rcon.rconCommandGuild(`/sc game.ban_player("${report.playername}", "${report.playername} ${reason}")`, guildConfig.guildId)
		// client.rcon.rconCommandGuild(`/sc game.ban_player("${event.report.playername}", "${reason}")`, guildConfig.guildId)
	})
}

export const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	let shouldPerformActions = false
	const guildConfigs: GuildConfig[] = []

	client.guilds.cache.forEach((guild) => {
		const guildConfig = client.guildConfigs.get(guild.id)
		if (!guildConfig) return
		const infochannels = client.infochannels.get(guild.id)
		if (
			guildConfig.ruleFilters?.includes(event.revocation.brokenRule) &&
			guildConfig.trustedCommunities?.includes(event.revocation.communityId)
		) {
			if (infochannels) {
				infochannels.forEach(c => {
					const channel = client.channels.cache.get(c.channelID)
					if (!channel || !channel.isNotDMChannel()) return
					client.addEmbedToQueue(channel.id, embed)
				})
			}
			shouldPerformActions = true
			guildConfigs.push(guildConfig)
		}
	})

	if (!shouldPerformActions) return // did not match any filters so return

	revocationHandler(client, guildConfigs, event.revocation)
}
/**
 * @param guildConfigs array of guild configs that are affected by the revocation, i.e. it matches their community and rule filters
 */
const revocationHandler = async (client: FAGCBot, guildConfigs: GuildConfig[], revocation: Revocation) => {
	// remove the report record
	await client.db.fagcBan.delete({
		where: {
			id: revocation.reportId
		}
	})

	const isPrivateBanned = await client.db.privatebans.findFirst({
		where: {
			playername: revocation.playername
		}
	})
	if (isPrivateBanned) return // if the player is blacklisted, don't do anything

	const otherBan = await client.db.fagcBan.findFirst({
		where: {
			playername: revocation.playername
		}
	})

	// unban the player where it is wanted
	await Promise.allSettled(
		guildConfigs.map((guildConfig) => {
			const command = client.createUnbanCommand(revocation.playername, guildConfig.guildId)
			if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
			client.rcon.rconCommandGuild(`/sc ${command}`, guildConfig.guildId)
		})
	)

	// if there is another FAGC report that conforms to the rules + communities, perform desired actions with it
	if (otherBan) {
		// there are other reports that the player is still banned for
		const report = await client.fagc.reports.fetchReport({ reportid: otherBan.id })
		if (!report) return
		// unban in guilds that its supposed to
		guildConfigs.map((guildConfig) => {
			const command = client.createBanCommand(report, guildConfig.guildId)
			if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
			client.rcon.rconCommandGuild(`/sc ${command};`, guildConfig.guildId)
		})
		
	}
}

		})
		
	}

}

export const guildConfigChanged = async ({ client, event }: HandlerOpts<"guildConfigChanged">) => {
	const oldConfig = client.guildConfigs.get(event.config.guildId)

	// TODO: perform an action

	client.guildConfigs.set(event.config.guildId, event.config)

}