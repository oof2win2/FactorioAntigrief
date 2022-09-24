import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBot from "./FAGCBot"
import {
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
import FAGCBan from "../database/FAGCBan"

interface HandlerOpts<T extends keyof WebSocketEvents> {
	event: Parameters<WebSocketEvents[T]>[0]
	client: FAGCBot
}

const communityCreated = ({
	client,
	event,
}: HandlerOpts<"communityCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((infoChannel) => {
		const channel = client.channels.cache.get(infoChannel.channelId)
		if (!channel || !channel.isNotDMChannel()) return
		client.addEmbedToQueue(channel.id, embed)
	})
}

const communityRemoved = ({
	client,
	event,
}: HandlerOpts<"communityRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((infoChannel) => {
		const channel = client.channels.cache.get(infoChannel.channelId) as
			| NewsChannel
			| TextChannel
			| ThreadChannel
			| undefined
		if (!channel) return
		client.addEmbedToQueue(channel.id, embed)
	})
}

const categoryCreated = ({ client, event }: HandlerOpts<"categoryCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((infoChannel) => {
		const channel = client.channels.cache.get(infoChannel.channelId)
		if (!channel || !channel.isNotDMChannel()) return
		client.addEmbedToQueue(channel.id, embed)
	})
}

const categoryRemoved = async ({
	client,
	event,
}: HandlerOpts<"categoryRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((infoChannel) => {
		const channel = client.channels.cache.get(infoChannel.channelId)
		if (!channel || !channel.isNotDMChannel()) return
		client.addEmbedToQueue(channel.id, embed)
	})
}

const report = async ({ client, event }: HandlerOpts<"report">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	const filterObject = client.filterObject

	// send the embed to info channels
	client.infochannels.forEach((c) => {
		const channel = client.channels.cache.get(c.channelId)
		if (!channel || !channel.isNotDMChannel()) return
		client.addEmbedToQueue(channel.id, embed)
	})

	// figure out whether it should ban or not
	const guildsToBan = await handleReport({
		database: client.db,
		report: event.report,
		filter: filterObject,
	})
	if (!guildsToBan) return

	// ban in guilds that its supposed to
	const command = client.createBanCommand(event.report)
	if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
	client.createActionForReport(event.report.playername)
	client.rcon.rconCommandAll(`/sc ${command}; rcon.print(true)`)
}

const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })
	const filterObject = client.filterObject

	client.infochannels.forEach((c) => {
		const channel = client.channels.cache.get(c.channelId) as
			| NewsChannel
			| TextChannel
			| ThreadChannel
			| undefined
		if (!channel) return
		client.addEmbedToQueue(channel.id, embed)
	})

	// check whether it should unban or not
	const shouldUnban = await handleRevocation({
		database: client.db,
		revocation: event.revocation,
		filter: filterObject,
	})
	if (!shouldUnban) return

	// unban if it should
	const command = client.createUnbanCommand(event.revocation.playername)
	if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
	client.createActionForUnban(event.revocation.playername)
	client.rcon.rconCommandAll(
		`/sc game.unban_player("${event.revocation.playername}"); rcon.print(true)`
	)
}

const guildConfigChanged = async ({
	client,
	event,
}: HandlerOpts<"guildConfigChanged">) => {
	client.guildConfig = event.config // set the new config
}

const filterObjectChanged = async ({
	client,
	event,
}: HandlerOpts<"filterObjectChanged">) => {
	const filterObject = event.filterObject
	client.filterObject = filterObject

	const validReports = await client.fagc.reports.list({
		categoryIds: filterObject.categoryFilters,
		communityIds: filterObject.communityFilters,
	})

	const results = await filterObjectChangedBanlists({
		database: client.db,
		newFilter: filterObject,
		validReports: validReports,
	})

	// initially, create all of the actions for the reports
	results.toBan.forEach((playername) => {
		client.createActionForReport(playername)
	})
	results.toUnban.forEach((playername) => {
		client.createActionForUnban(playername)
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
	const filterObject = client.filterObject

	const allReportIds = await client.db
		.getRepository(FAGCBan)
		.createQueryBuilder()
		.select(["id"])
		.getMany()

	// we fetch the missed reports and revocations and act on each of them
	const reports = await client.fagc.reports.fetchSince({
		timestamp: lastReceivedDate,
	})
	const revocations = await client.fagc.revocations.fetchBulk({
		since: lastReceivedDate,
		reportIds: allReportIds.map((r) => r.id),
	})

	const banCommands: string[] = []
	const unbanCommands: string[] = []

	if (filterObject) {
		for (const report of reports) {
			const shouldBan = await handleReport({
				database: client.db,
				report: report,
				filter: filterObject,
			})
			if (!shouldBan) continue

			// ban in guilds that its supposed to
			const command = client.createBanCommand(report)
			if (!command) continue // if it is not supposed to do anything in this guild, then it won't do anything
			client.createActionForReport(report.playername)
			banCommands.push(command)
		}

		for (const revocation of revocations) {
			const shouldUnban = await handleRevocation({
				database: client.db,
				revocation: revocation,
				filter: filterObject,
			})
			if (!shouldUnban) continue

			const command = client.createUnbanCommand(revocation.playername)
			if (!command) continue // if it is not supposed to do anything in this guild, then it won't do anything
			client.createActionForUnban(revocation.playername)
			unbanCommands.push(command)
		}
	}

	// add guild IDs back into the websocket handler after all of this was done
	client.fagc.websocket.addGuildId(ENV.GUILDID)
	client.fagc.websocket.addFilterObjectId(ENV.FILTEROBJECTID)

	// execute the commands in batches
	for (const commandGroup of splitIntoGroups(banCommands)) {
		await client.rcon.rconCommandAll(
			`/sc ${commandGroup.join(";")}; rcon.print(true)`
		)
	}

	for (const commandGroup of splitIntoGroups(unbanCommands)) {
		await client.rcon.rconCommandAll(
			`/sc ${commandGroup.join(";")}; rcon.print(true)`
		)
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
