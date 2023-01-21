import { WebSocketEvents } from "@fdgl/wrapper/dist/WebsocketListener"
import FDGLBot from "./FDGLBot"
import { EmbedBuilder } from "discord.js"
import filterObjectChangedBanlists from "../utils/functions/filterObjectChangedBanlists"
import handleReport from "../utils/functions/handleReport"
import handleRevocation from "../utils/functions/handleRevocation"
import reportCreatedActionHandler from "../utils/functions/reportCreatedActionHandler"
import reportRevokedActionHandler from "../utils/functions/reportRevokedActionHandler"
import ENV from "../utils/env"
import FDGLBan from "../database/FDGLBan"
import CategoryActions from "../database/CategoryActions"
import { FDGLCategoryAction } from "../types"
import { Category, Community, Report } from "@fdgl/types"
import ActionLog from "../database/ActionLog"
import { splitIntoGroups } from "../utils/functions"

interface HandlerOpts<T extends keyof WebSocketEvents> {
	event: Parameters<WebSocketEvents[T]>[0]
	client: FDGLBot
}

const communityCreated = ({
	client,
	event,
}: HandlerOpts<"communityCreated">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })

	client.addEmbedToAllQueues(embed)
}

const communityRemoved = ({
	client,
	event,
}: HandlerOpts<"communityRemoved">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })

	client.addEmbedToAllQueues(embed)
}

const categoryCreated = ({ client, event }: HandlerOpts<"categoryCreated">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })

	client.addEmbedToAllQueues(embed)

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

	client.addEmbedToAllQueues(embed)

	client.FDGLCategoryActions.delete(event.category.id)
	client.db.getRepository(CategoryActions).delete({
		id: event.category.id,
	})
}

const report = async ({ client, event }: HandlerOpts<"report">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })
	const filterObject = client.filterObject

	client.addEmbedToAllQueues(embed)

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
	const stuffToDo = reportCreatedActionHandler(
		event.report,
		event.extraData.category,
		event.extraData.community,
		action,
		client
	)
	for (const item of stuffToDo) {
		switch (item.type) {
			case FDGLCategoryAction.DiscordMessage:
				client.addEmbedToAllQueues(embed)
				break
			case FDGLCategoryAction.FactorioMessage:
				client.rcon.rconCommandAll(`/sc game.print("${item.message}")`)
				client.db.getRepository(ActionLog).insert({
					command: `/sc game.print("${item.message}")`,
				})
				break
			case FDGLCategoryAction.FactorioBan:
				client.createActionForReport(report.playername)
				client.rcon.rconCommandAll(item.command)
				client.db.getRepository(ActionLog).insert({
					command: item.command,
				})
				break
			case FDGLCategoryAction.CustomCommand:
				client.createActionForReport(report.playername)
				client.rcon.rconCommandAll(item.command)
				client.db.getRepository(ActionLog).insert({
					command: item.command,
				})
				break
		}
	}
}

const revocation = async ({ client, event }: HandlerOpts<"revocation">) => {
	const embed = new EmbedBuilder({ ...event.embed, type: undefined })
	const filterObject = client.filterObject

	client.addEmbedToAllQueues(embed)

	const revocation = event.revocation

	// we need this for after the revocation is handled to check which actions should be taken
	const validReports = await client.db.getRepository(FDGLBan).find({
		where: {
			playername: revocation.playername,
		},
	})

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
	const stuffToDo = reportRevokedActionHandler(
		event.revocation,
		event.extraData.category,
		event.extraData.community,
		action,
		client
	)
	for (const item of stuffToDo) {
		switch (item.type) {
			case FDGLCategoryAction.DiscordMessage:
				client.addEmbedToAllQueues(embed)
				break
			case FDGLCategoryAction.FactorioMessage:
				client.rcon.rconCommandAll(`/sc game.print("${item.message}")`)
				client.db.getRepository(ActionLog).insert({
					command: `/sc game.print("${item.message}")`,
				})
				break
			case FDGLCategoryAction.FactorioBan:
				client.createActionForUnban(revocation.playername)
				client.rcon.rconCommandAll(item.command)
				client.db.getRepository(ActionLog).insert({
					command: item.command,
				})
				break
			case FDGLCategoryAction.CustomCommand:
				client.createActionForUnban(revocation.playername)
				client.db.getRepository(ActionLog).insert({
					command: item.command,
				})
				break
		}
	}
	// now we need to re-ban the player if they have other reports that would ban them
	// and if the revoked report would have banned them
	const didRevocationBan = action.createAction.includes(
		FDGLCategoryAction.FactorioBan
	)
	const bannedAfterRevocation: FDGLBan[] = []
	for (const report of validReports) {
		const action = client.FDGLCategoryActions.get(report.categoryId)
		if (!action) continue
		if (report.id !== revocation.id) {
			if (action.createAction.includes(FDGLCategoryAction.FactorioBan)) {
				bannedAfterRevocation.push(report)
			}
		}
	}

	if (bannedAfterRevocation.length && didRevocationBan) {
		// we do this for loop just in case any of the reports are invalid
		for (const report of bannedAfterRevocation) {
			// we need to re-ban the player for the other report
			const fullReport = await client.fdgl.reports.fetchReport({
				reportId: report.id,
			})
			if (!fullReport) continue // the report was most likely revoked in the meantime

			// now we need to create a ban command and execute it
			const command = client.createBanCommand(fullReport)
			client.createActionForReport(report.playername)
			client.rcon.rconCommandAll(command)
			break // success running this one, so we can stop
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
	const oldFilterObject = client.filterObject
	client.filterObject = filterObject

	const validReports = await client.fdgl.reports.list({
		categoryIds: filterObject.categoryFilters,
		communityIds: filterObject.communityFilters,
	})
	// get a list of all reports that are no longer valid, will act as "revocations"
	const invalidReports = await client.fdgl.reports.list({
		categoryIds: oldFilterObject.categoryFilters.filter(
			(x) => !filterObject.categoryFilters.includes(x)
		),
		communityIds: oldFilterObject.communityFilters.filter(
			(x) => !filterObject.communityFilters.includes(x)
		),
	})

	const results = await filterObjectChangedBanlists({
		database: client.db,
		newFilter: filterObject,
		validReports: validReports,
	})

	const allCategories = new Map<string, Category>(
		(await client.fdgl.categories.fetchAll({})).map((c) => [c.id, c])
	)
	const allCommunities = new Map<string, Community>(
		(await client.fdgl.communities.fetchAll({})).map((c) => [c.id, c])
	)

	const reportEmbeds: EmbedBuilder[] = []
	const reportFactorioMessages: string[] = []
	const reportFactorioCommands: string[] = []

	// initially, create all of the actions for the reports
	results.toBan.forEach((playername) => {
		const report = validReports.find((r) => r.playername === playername)
		if (!report) return
		const actions = reportCreatedActionHandler(
			report,
			allCategories.get(report.categoryId)!,
			allCommunities.get(report.communityId)!,
			client.FDGLCategoryActions.get(report.categoryId)!,
			client
		)
		for (const item of actions) {
			switch (item.type) {
				case FDGLCategoryAction.DiscordMessage:
					reportEmbeds.push(item.embed)
					break
				case FDGLCategoryAction.FactorioMessage:
					reportFactorioMessages.push(item.message)
					break
				case FDGLCategoryAction.FactorioBan:
					reportFactorioCommands.push(item.command)
					break
				case FDGLCategoryAction.CustomCommand:
					reportFactorioCommands.push(item.command)
					break
			}
		}
	})
	results.toUnban.forEach((playername) => {
		const revocation = invalidReports.find(
			(r) => r.playername === playername
		)
		if (!revocation) return
		const actions = reportRevokedActionHandler(
			{
				...revocation,
				revokedAt: new Date(),
				revokedBy: "0",
			},
			allCategories.get(revocation.categoryId)!,
			allCommunities.get(revocation.communityId)!,
			client.FDGLCategoryActions.get(revocation.categoryId)!,
			client
		)
		for (const item of actions) {
			switch (item.type) {
				case FDGLCategoryAction.DiscordMessage:
					reportEmbeds.push(item.embed)
					break
				case FDGLCategoryAction.FactorioMessage:
					reportFactorioMessages.push(item.message)
					break
				case FDGLCategoryAction.FactorioBan:
					reportFactorioCommands.push(item.command)
					break
				case FDGLCategoryAction.CustomCommand:
					reportFactorioCommands.push(item.command)
					break
			}
		}
	})

	// now, send all of the actions
	for (const embed of reportEmbeds) {
		client.addEmbedToAllQueues(embed)
	}
	for (const message of reportFactorioMessages) {
		client.rcon.rconCommandAll(`/sc game.print("${message}")`)
	}
	for (const command of reportFactorioCommands) {
		client.rcon.rconCommandAll(command)
	}
	// we also need to save all of the actions to the database
	for (const group of splitIntoGroups(reportFactorioMessages, 500)) {
		await client.db
			.getRepository(ActionLog)
			.createQueryBuilder()
			.insert()
			.values(
				group.map((message) => {
					return {
						command: `/sc game.print("${message}")`,
					}
				})
			)
			.execute()
	}
	for (const group of splitIntoGroups(reportFactorioCommands, 500)) {
		await client.db
			.getRepository(ActionLog)
			.createQueryBuilder()
			.insert()
			.values(
				group.map((command) => {
					return {
						command: command,
					}
				})
			)
			.execute()
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
	const allCategories = new Map<string, Category>(
		(await client.fdgl.categories.fetchAll({})).map((c) => [c.id, c])
	)
	const allCommunities = new Map<string, Community>(
		(await client.fdgl.communities.fetchAll({})).map((c) => [c.id, c])
	)

	const reportEmbeds: EmbedBuilder[] = []
	const reportFactorioMessages: string[] = []
	const reportFactorioCommands: string[] = []

	if (filterObject) {
		for (const report of reports) {
			const shouldBan = await handleReport({
				database: client.db,
				report: report,
				filter: filterObject,
			})
			if (!shouldBan) continue

			const actions = reportCreatedActionHandler(
				report,
				allCategories.get(report.categoryId)!,
				allCommunities.get(report.communityId)!,
				client.FDGLCategoryActions.get(report.categoryId)!,
				client
			)
			for (const item of actions) {
				switch (item.type) {
					case FDGLCategoryAction.DiscordMessage:
						reportEmbeds.push(item.embed)
						break
					case FDGLCategoryAction.FactorioMessage:
						reportFactorioMessages.push(item.message)
						break
					case FDGLCategoryAction.FactorioBan:
						reportFactorioCommands.push(item.command)
						break
					case FDGLCategoryAction.CustomCommand:
						reportFactorioCommands.push(item.command)
						break
				}
			}
		}

		for (const revocation of revocations) {
			const shouldUnban = await handleRevocation({
				database: client.db,
				revocation: revocation,
				filter: filterObject,
				offlineServerCount: client.rcon.offlineServerCount,
			})
			if (!shouldUnban) continue

			const actions = reportRevokedActionHandler(
				revocation,
				allCategories.get(revocation.categoryId)!,
				allCommunities.get(revocation.communityId)!,
				client.FDGLCategoryActions.get(revocation.categoryId)!,
				client
			)
			for (const item of actions) {
				switch (item.type) {
					case FDGLCategoryAction.DiscordMessage:
						reportEmbeds.push(item.embed)
						break
					case FDGLCategoryAction.FactorioMessage:
						reportFactorioMessages.push(item.message)
						break
					case FDGLCategoryAction.FactorioBan:
						reportFactorioCommands.push(item.command)
						break
					case FDGLCategoryAction.CustomCommand:
						reportFactorioCommands.push(item.command)
						break
				}
			}
		}
	}

	// add guild IDs back into the websocket handler after all of this was done
	client.fdgl.websocket.addGuildId(ENV.GUILDID)
	client.fdgl.websocket.addFilterObjectId(ENV.FILTEROBJECTID)

	// now, send all of the actions
	for (const embed of reportEmbeds) {
		client.addEmbedToAllQueues(embed)
	}
	for (const message of reportFactorioMessages) {
		client.rcon.rconCommandAll(`/sc game.print("${message}")`)
	}
	for (const command of reportFactorioCommands) {
		client.rcon.rconCommandAll(command)
	}
	// we also need to save all of the actions to the database
	for (const group of splitIntoGroups(reportFactorioMessages, 500)) {
		await client.db
			.getRepository(ActionLog)
			.createQueryBuilder()
			.insert()
			.values(
				group.map((message) => {
					return {
						command: `/sc game.print("${message}")`,
					}
				})
			)
			.execute()
	}
	for (const group of splitIntoGroups(reportFactorioCommands, 500)) {
		await client.db
			.getRepository(ActionLog)
			.createQueryBuilder()
			.insert()
			.values(
				group.map((command) => {
					return {
						command: command,
					}
				})
			)
			.execute()
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
