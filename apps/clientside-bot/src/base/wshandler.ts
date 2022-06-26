import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBot from "./FAGCBot"
import {
	Collection,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	ThreadChannel,
} from "discord.js"
import {
	filterObjectChangedBanlists,
	handleReport,
	handleRevocation,
	splitIntoGroups,
} from "../utils/functions"
import ENV from "../utils/env"

interface HandlerOpts<T extends keyof WebSocketEvents> {
	event: Parameters<WebSocketEvents[T]>[0]
	client: FAGCBot
}

const communityCreated = ({
	client,
	event,
}: HandlerOpts<"communityCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

const communityRemoved = ({
	client,
	event,
}: HandlerOpts<"communityRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId) as
				| NewsChannel
				| TextChannel
				| ThreadChannel
				| undefined
			if (!channel) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

const categoryCreated = ({ client, event }: HandlerOpts<"categoryCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

const categoryRemoved = async ({
	client,
	event,
}: HandlerOpts<"categoryRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

const report = async ({ client, event }: HandlerOpts<"report">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	const allFilters = await client.getAllFilters()

	const whereToSend = [...client.guildConfigs.values()].filter(
		(guildConfig) => {
			const filter = allFilters.find(
				(f) => f.id === guildConfig.filterObjectId
			)!
			// check whether the revocation is valid under this guild's config
			return (
				filter.categoryFilters.includes(event.report.categoryId) &&
				filter.communityFilters.includes(event.report.communityId)
			)
		}
	)

	// the report is invalid for all guilds, so we don't care about it
	if (whereToSend.length == 0) return

	// send the embed to each guilds's info channels
	whereToSend.map((guildConfig) => {
		const infochannels = client.infochannels.get(guildConfig.guildId)
		if (!infochannels) return
		infochannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})

	// get guilds where to ban
	const guildsToBan = await handleReport({
		database: client.db,
		report: event.report,
		allGuildConfigs: [...client.guildConfigs.values()],
		allFilters,
	})
	if (!guildsToBan) return

	// ban in guilds that its supposed to
	guildsToBan.map((guildId) => {
		const command = client.createBanCommand(event.report)
		if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
		client.rcon.rconCommandAll(`/sc ${command}; rcon.print(true)`)
	})
}

const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	const allFilters = await client.getAllFilters()

	const whereToSend = [...client.guildConfigs.values()].filter(
		(guildConfig) => {
			const filter = allFilters.find(
				(f) => f.id === guildConfig.filterObjectId
			)!
			// check whether the revocation is valid under this guild's config
			return (
				filter.categoryFilters.includes(event.revocation.categoryId) &&
				filter?.communityFilters.includes(event.revocation.communityId)
			)
		}
	)

	// the report is invalid for all guilds, so we don't care about it
	if (whereToSend.length == 0) return

	// send the embed to each guilds's info channels
	whereToSend.map((guildConfig) => {
		const infochannels = client.infochannels.get(guildConfig.guildId)
		if (!infochannels) return
		infochannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId) as
				| NewsChannel
				| TextChannel
				| ThreadChannel
				| undefined
			if (!channel) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})

	// get guilds where to unban
	const guildsToUnban = await handleRevocation({
		database: client.db,
		revocation: event.revocation,
		allGuildConfigs: [...client.guildConfigs.values()],
		allFilters,
	})
	if (!guildsToUnban) return

	// unban in guilds that its supposed to
	guildsToUnban.map((guildId) => {
		const command = client.createUnbanCommand(event.revocation.playername)
		if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
		client.rcon.rconCommandAll(
			`/sc game.unban_player("${event.revocation.playername}"); rcon.print(true)`
		)
	})
}

const guildConfigChanged = async ({
	client,
	event,
}: HandlerOpts<"guildConfigChanged">) => {
	client.guildConfigs.set(event.config.guildId, event.config) // set the new config
}

const filterObjectChanged = async ({
	client,
	event,
}: HandlerOpts<"filterObjectChanged">) => {
	// client.filterObjects.set(event.filterObject.id, event.filterObject) // set the new filter object
	const allFilters = await client.getAllFilters()
	const filter = event.filterObject
	client.filterObject = filter

	const validReports = await client.fagc.reports.list({
		categoryIds: filter.categoryFilters,
		communityIds: filter.communityFilters,
	})

	const results = await filterObjectChangedBanlists({
		database: client.db,
		newConfig: event.filterObject,
		validReports: validReports,
		allFilters,
	})

	// ban players
	const playerBanStrings = results.toBan.map(
		(playername) =>
			`game.ban_player("${playername}", "View your FAGC reports on https://factoriobans.club/api/reports/search?${new URLSearchParams(
				{ playername: playername }
			).toString()}")`
	)
	for (const playerBanGroup of splitIntoGroups(playerBanStrings)) {
		await client.rcon.rconCommandAll(
			`/sc ${playerBanGroup.join(";")}; rcon.print(true)`
		)
	}

	// unban players
	const playerUnbanStrings = results.toUnban.map(
		(playername) => `game.unban_player("${playername}")`
	)
	for (const playerUnbanGroup of splitIntoGroups(playerUnbanStrings)) {
		await client.rcon.rconCommandAll(
			`/sc ${playerUnbanGroup.join(";")}; rcon.print(true)`
		)
	}
}

// removing of guild IDs from the websocket is done so that they don't interfere once the socket connects again
const disconnected = ({ client }: HandlerOpts<"disconnected">) => {
	for (const guildID of client.fagc.websocket.guildIds) {
		client.fagc.websocket.removeGuildId(guildID)
	}
	client.fagc.websocket.removeFilterObjectId(ENV.FILTEROBJECTID)
}
// here, we handle stuff since the last connection, such as fetching missed reports, revocations etc.
const connected = async ({ client }: HandlerOpts<"connected">) => {
	const lastReceivedDate = client.botConfig.lastNotificationProcessed
	const allFilters = await client.getAllFilters()

	// we fetch the missed reports and revocations and act on each of them
	const reports = await client.fagc.reports.fetchSince({
		timestamp: lastReceivedDate,
	})
	const revocations = await client.fagc.revocations.fetchSince({
		timestamp: lastReceivedDate,
	})

	const banCommands = new Collection<string, string[]>()
	const unbanCommands = new Collection<string, string[]>()

	client.guilds.cache.forEach((guild) => {
		banCommands.set(guild.id, [])
		unbanCommands.set(guild.id, [])
	})

	for (const report of reports) {
		const guildsToBan = await handleReport({
			database: client.db,
			report: report,
			allGuildConfigs: [...client.guildConfigs.values()],
			allFilters,
		})
		if (!guildsToBan) return

		// ban in guilds that its supposed to
		guildsToBan.map((guildId) => {
			const command = client.createBanCommand(report)
			if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
			banCommands.get(guildId)?.push(command)
		})
	}

	for (const revocation of revocations) {
		const guildsToUnban = await handleRevocation({
			database: client.db,
			revocation: revocation,
			allGuildConfigs: [...client.guildConfigs.values()],
			allFilters,
		})
		if (!guildsToUnban) return
		guildsToUnban.map((guildId) => {
			const command = client.createUnbanCommand(revocation.playername)
			if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
			unbanCommands.get(guildId)?.push(command)
		})
	}

	// add guild IDs back into the websocket handler after all of this was done
	for (const [_, guild] of client.guilds.cache) {
		client.fagc.websocket.addGuildId(guild.id)
	}
	client.fagc.websocket.addFilterObjectId(ENV.FILTEROBJECTID)

	// execute the commands in batches
	for (const [_, commands] of banCommands.entries()) {
		if (!commands.length) continue
		for (const commandGroup of splitIntoGroups(commands)) {
			await client.rcon.rconCommandAll(
				`/sc ${commandGroup.join(";")}; rcon.print(true)`
			)
		}
	}
	for (const [_, commands] of unbanCommands.entries()) {
		if (!commands.length) continue
		for (const commandGroup of splitIntoGroups(commands)) {
			await client.rcon.rconCommandAll(
				`/sc ${commandGroup.join(";")}; rcon.print(true)`
			)
		}
	}
}

const EventHandlers: Record<
	keyof WebSocketEvents,
	((data: any) => Promise<any> | any) | null
> = {
	communityCreated,
	communityRemoved,
	communityUpdated: null,
	communitiesMerged: null,
	categoryCreated,
	categoryRemoved,
	categoryUpdated: null,
	categoriesMerged: null,
	report,
	revocation,
	guildConfigChanged,
	filterObjectChanged,
	disconnected,
	connected,
}
export default EventHandlers
