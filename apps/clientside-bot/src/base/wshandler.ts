import { WebSocketEvents } from "@fdgl/wrapper/dist/WebsocketListener"
import FDGLBot from "./FDGLBot"
import {
	EmbedBuilder,
	NewsChannel,
	TextChannel,
	ThreadChannel,
} from "discord.js"
import filterObjectChangedBanlists from "../utils/functions/filterObjectChangedBanlists"
import handleReport from "../utils/functions/handleReport"
import handleRevocation from "../utils/functions/handleRevocation"
import splitIntoGroups from "../utils/functions/splitIntoGroups"
import reportCreatedActionHandler from "../utils/functions/reportCreatedActionHandler"
import reportRevokedActionHandler from "../utils/functions/reportRevokedActionHandler"
import ENV from "../utils/env"
import FDGLBan from "../database/FDGLBan"
import CategoryActions from "../database/CategoryActions"
import { FDGLCategoryAction } from "../types"

interface HandlerOpts<T extends keyof WebSocketEvents> {
	event: Parameters<WebSocketEvents[T]>[0]
	client: FDGLBot
}

const communityCreated = ({
	client,
	event,
}: HandlerOpts<"communityCreated">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })

	client.infochannels.forEach((infoChannel) => {
		const channel = client.channels.cache.get(infoChannel.channelId)
		if (!channel || !channel.isTextBased()) return
		client.addEmbedToQueue(channel.id, embed)
	})
}

const communityRemoved = ({
	client,
	event,
}: HandlerOpts<"communityRemoved">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })

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
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })

	client.infochannels.forEach((infoChannel) => {
		const channel = client.channels.cache.get(infoChannel.channelId)
		if (!channel || !channel.isTextBased()) return
		client.addEmbedToQueue(channel.id, embed)
	})

	client.FDGLCategoryActions.set(event.category.id, {
		createAction: [],
		revokeAction: [],
		createCustomCommand: null,
		revokeCustomCommand: null,
		clearCustomCommand: null,
		factorioMessage: null,
	})
	client.db.getRepository(CategoryActions).save({
		id: event.category.id,
	})
}

const categoryRemoved = async ({
	client,
	event,
}: HandlerOpts<"categoryRemoved">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })

	client.infochannels.forEach((infoChannel) => {
		const channel = client.channels.cache.get(infoChannel.channelId)
		if (!channel || !channel.isTextBased()) return
		client.addEmbedToQueue(channel.id, embed)
	})

	client.FDGLCategoryActions.delete(event.category.id)
	client.db.getRepository(CategoryActions).delete({
		id: event.category.id,
	})
}

const report = async ({ client, event }: HandlerOpts<"report">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })
	const filterObject = client.filterObject

	// send the embed to info channels
	client.infochannels.forEach((c) => {
		const channel = client.channels.cache.get(c.channelId)
		if (!channel || !channel.isTextBased()) return
		client.addEmbedToQueue(channel.id, embed)
	})

	const report = event.report

	// figure out whether it should ban or not
	const shouldBan = await handleReport({
		database: client.db,
		report: report,
		filter: filterObject,
	})
	if (!shouldBan) return

	const action = client.FDGLCategoryActions.get(report.categoryId)
	if (!action) return
	const stuffToDo = reportCreatedActionHandler(event, action, client)
	for (const item of stuffToDo) {
		switch (item.type) {
			case FDGLCategoryAction.DiscordMessage:
				for (const infochannel of client.infochannels) {
					const channel = client.channels.cache.get(
						infochannel.channelId
					)
					if (!channel || !channel.isTextBased()) continue
					client.addEmbedToQueue(channel.id, item.embed)
				}
				break
			case FDGLCategoryAction.FactorioMessage:
				client.rcon.rconCommandAll(`/sc game.print("${item.message}")`)
				break
			case FDGLCategoryAction.FactorioBan:
				client.createActionForReport(report.playername)
				client.rcon.rconCommandAll(item.command)
				break
			case FDGLCategoryAction.CustomCommand:
				client.createActionForReport(report.playername)
				client.rcon.rconCommandAll(item.command)
				break
		}
	}
}

const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })
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

	const revocation = event.revocation

	// check whether it should unban or not
	const shouldUnban = await handleRevocation({
		database: client.db,
		revocation: revocation,
		filter: filterObject,
		offlineServerCount: client.rcon.offlineServerCount,
	})
	if (!shouldUnban) return

	const action = client.FDGLCategoryActions.get(revocation.categoryId)
	if (!action) return
	const stuffToDo = reportRevokedActionHandler(event, action, client)
	for (const item of stuffToDo) {
		switch (item.type) {
			case FDGLCategoryAction.DiscordMessage:
				for (const infochannel of client.infochannels) {
					const channel = client.channels.cache.get(
						infochannel.channelId
					)
					if (!channel || !channel.isTextBased()) continue
					client.addEmbedToQueue(channel.id, item.embed)
				}
				break
			case FDGLCategoryAction.FactorioMessage:
				client.rcon.rconCommandAll(`/sc game.print("${item.message}")`)
				break
			case FDGLCategoryAction.FactorioBan:
				client.createActionForUnban(revocation.playername)
				client.rcon.rconCommandAll(item.command)
				break
			case FDGLCategoryAction.CustomCommand:
				client.createActionForUnban(revocation.playername)
				client.rcon.rconCommandAll(item.command)
				break
		}
	}
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

	const validReports = await client.fdgl.reports.list({
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
			`game.ban_player("${playername}", "View your FDGL reports on https://factoriobans.club/api/reports/search?${new URLSearchParams(
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
	for (const guildID of client.fdgl.websocket.guildIds) {
		client.fdgl.websocket.removeGuildId(guildID)
	}
	client.fdgl.websocket.removeFilterObjectId(ENV.FILTEROBJECTID)
}

// here, we handle stuff since the last connection, such as fetching missed reports, revocations etc.
const connected = async ({ client }: HandlerOpts<"connected">) => {
	const lastReceivedDate = client.botConfig.lastNotificationProcessed
	const filterObject = client.filterObject

	const allReportIds = await client.db
		.getRepository(FDGLBan)
		.createQueryBuilder()
		.select(["id"])
		.getMany()

	// we fetch the missed reports and revocations and act on each of them
	const reports = await client.fdgl.reports.fetchSince({
		timestamp: lastReceivedDate,
	})
	const revocations = await client.fdgl.revocations.fetchBulk({
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
				offlineServerCount: client.rcon.offlineServerCount,
			})
			if (!shouldUnban) continue

			const command = client.createUnbanCommand(revocation.playername)
			if (!command) continue // if it is not supposed to do anything in this guild, then it won't do anything
			client.createActionForUnban(revocation.playername)
			unbanCommands.push(command)
		}
	}

	// add guild IDs back into the websocket handler after all of this was done
	client.fdgl.websocket.addGuildId(ENV.GUILDID)
	client.fdgl.websocket.addFilterObjectId(ENV.FILTEROBJECTID)

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
