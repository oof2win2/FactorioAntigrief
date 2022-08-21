import { createConnection, Connection } from "typeorm"
import handleMissedData from "../../src/utils/functions/handleMissedData"
import BotConfig from "../../src/database/BotConfig"
import FAGCBan from "../../src/database/FAGCBan"
import InfoChannel from "../../src/database/InfoChannel"
import PrivateBan from "../../src/database/PrivateBan"
import Whitelist from "../../src/database/Whitelist"
import {
	createFAGCCategory,
	createFAGCCommunity,
	createFAGCReport,
	createGuildConfig,
	createTimes,
	createWhitelist,
} from "../utils"
import { Category, Community } from "fagc-api-types"
import ServerOnline from "../../src/database/ServerOnline"
import faker from "faker"

describe("handleMissedData", () => {
	let database: Connection
	let categories: Category[]
	let categoryIds: string[]
	let communities: Community[]
	let communityIds: string[]
	// server is offline for 1h
	const serverOfflineSince = new Date(Date.now() - 3600 * 1000)

	beforeEach(async () => {
		database = await createConnection({
			type: "better-sqlite3",
			database: ":memory:",
			entities: [FAGCBan, InfoChannel, BotConfig, PrivateBan, Whitelist],
			synchronize: true,
		})
		categories = createTimes(createFAGCCategory, 100)
		categoryIds = categories.map((x) => x.id)
		communities = createTimes(createFAGCCommunity, 100)
		communityIds = communities.map((x) => x.id)
	})

	afterEach(async () => {
		await database.close()
	})

	it("Should do nothing if all data was received by the server", async () => {
		const [_, filter] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: filter.categoryFilters,
					communityIds: filter.communityFilters,
				},
			],
			5000
		)

		const server: ServerOnline = {
			name: "TESTSERVER",
			offlineSince: serverOfflineSince,
			isOnline: true,
		}

		// ensure that the database stores all of the reports as created before the server went offline
		// so that the server received all of the reports
		const reportsCreatedAt = new Date(
			serverOfflineSince.valueOf() - 3600 * 1000
		)

		// save reports to db
		await database.getRepository(FAGCBan).save(
			reports.map(
				(report): FAGCBan => ({
					...report,
					createdAt: reportsCreatedAt,
					removedAt: null,
				})
			),
			{ chunk: 750 }
		)

		const result = await handleMissedData({
			server,
			allServers: [server],
			database,
			filter,
		})

		expect(result.playersToUnban.length).toBe(0)
		expect(result.privatebansToBan.length).toBe(0)
		expect(result.reportsToBan.length).toBe(0)
	})

	it("Should ban for every new report if the report is created after the server went offline", async () => {
		const [_, filter] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: filter.categoryFilters,
					communityIds: filter.communityFilters,
				},
			],
			10
		)

		const server: ServerOnline = {
			name: "TESTSERVER",
			offlineSince: serverOfflineSince,
			isOnline: true,
		}

		// ensure that the database stores all of the reports as created before the server went offline
		// so that the server received all of the reports
		const reportsCreatedAt = new Date(
			serverOfflineSince.valueOf() + 3600 * 1000
		)

		// save reports to db
		await database.getRepository(FAGCBan).save(
			reports.map(
				(report): FAGCBan => ({
					...report,
					createdAt: reportsCreatedAt,
					removedAt: null,
				})
			),
			{ chunk: 750 }
		)

		const result = await handleMissedData({
			server,
			allServers: [server],
			database,
			filter,
		})

		const resultPlayernames = result.reportsToBan.map((x) => x.playername)

		const playernames = [...new Set(reports.map((x) => x.playername))]

		expect(result.playersToUnban.length).toBe(0)
		expect(result.privatebansToBan.length).toBe(0)
		expect(resultPlayernames.length).toBe(playernames.length)
		expect(resultPlayernames).toEqual(playernames)
	})

	it("Should unban for every report if the report is revoked after the server went offline", async () => {
		const [_, filter] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: filter.categoryFilters,
					communityIds: filter.communityFilters,
				},
			],
			5000
		)

		const server: ServerOnline = {
			name: "TESTSERVER",
			offlineSince: serverOfflineSince,
			isOnline: true,
		}

		// ensure that the database stores all of the reports as created before the server went offline
		// so that the server received all of the reports
		const reportsCreatedAt = new Date(
			serverOfflineSince.valueOf() - 3600 * 1000
		)
		const reportsRemovedAt = new Date(
			serverOfflineSince.valueOf() + 60 * 1000
		)

		// save reports to db
		await database.getRepository(FAGCBan).save(
			reports.map(
				(report): FAGCBan => ({
					...report,
					createdAt: reportsCreatedAt,
					removedAt: reportsRemovedAt,
				})
			),
			{ chunk: 750 }
		)

		const result = await handleMissedData({
			server,
			allServers: [server],
			database,
			filter,
		})

		const playernames = [...new Set(reports.map((x) => x.playername))]

		expect(result.playersToUnban.length).toBe(playernames.length)
		expect(result.playersToUnban).toEqual(playernames)
		expect(result.privatebansToBan.length).toBe(0)
		expect(result.reportsToBan.length).toBe(0)
	})

	it("Should unban players if a whitelist was created whilst the server was down", async () => {
		const [_, filter] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const playernames = [
			...new Set(createTimes(faker.internet.userName, 25)),
		]
		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: filter.categoryFilters,
					communityIds: filter.communityFilters,
					playernames: playernames,
				},
			],
			5000
		)

		const whitelistedPlayers = new Set<string>()
		const whitelistEntries = createTimes(
			createWhitelist,
			[
				{
					playernames: playernames,
				},
			],
			2500
		)
			.filter((entry) => {
				if (whitelistedPlayers.has(entry.playername)) return false
				whitelistedPlayers.add(entry.playername)
				return true
			})
			.map((i) => {
				delete (i as any).id
				return i
			})

		const server: ServerOnline = {
			name: "TESTSERVER",
			offlineSince: serverOfflineSince,
			isOnline: true,
		}

		// ensure that the database stores all of the reports as created before the server went offline
		// so that the server received all of the reports
		const reportsCreatedAt = new Date(
			serverOfflineSince.valueOf() - 3600 * 1000
		)

		// save reports to db
		await database.getRepository(FAGCBan).save(
			reports.map(
				(report): FAGCBan => ({
					...report,
					createdAt: reportsCreatedAt,
					removedAt: null,
				})
			),
			{ chunk: 750 }
		)
		await database
			.getRepository(Whitelist)
			.save(whitelistEntries, { chunk: 750 })

		const result = await handleMissedData({
			server,
			allServers: [server],
			database,
			filter,
		})

		const playersWithReports = new Set(reports.map((x) => x.playername))
		const expectedUnbans: string[] = []
		for (const whitelist of whitelistEntries) {
			if (playersWithReports.has(whitelist.playername))
				expectedUnbans.push(whitelist.playername)
		}

		expect(result.playersToUnban.length).toBe(expectedUnbans.length)
		expect(result.playersToUnban.sort()).toEqual(expectedUnbans.sort())
		expect(result.privatebansToBan.length).toBe(0)
		expect(result.reportsToBan.length).toBe(0)
	})
})
