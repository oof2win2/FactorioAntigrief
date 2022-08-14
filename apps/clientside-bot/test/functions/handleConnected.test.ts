import { createConnection, Connection } from "typeorm"
import { handleConnected } from "../../src/utils/functions"
import BotConfig from "../../src/database/BotConfig"
import FAGCBan from "../../src/database/FAGCBan"
import InfoChannel from "../../src/database/InfoChannel"
import PrivateBan from "../../src/database/PrivateBan"
import Whitelist from "../../src/database/Whitelist"
import {
	createFAGCCategory,
	createFAGCCommunity,
	createFAGCReport,
	createFAGCRevocation,
	createTimes,
	randomElementsFromArray,
	reportIntoFAGCBan,
	simplifyDatabaseFAGCBan,
} from "../utils"
import { Category, Community } from "fagc-api-types"

describe("handleConnected", () => {
	let database: Connection
	let categories: Category[]
	let categoryIds: string[]
	let communities: Community[]
	let communityIds: string[]
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

	it("Should do nothing if no reports or revocations are created", async () => {
		const previousReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: categoryIds,
					communityIds: communityIds,
				},
			],
			750
		)

		// assemble a list of new reports, some that are old and some that have been created

		// figure out all of the data before the function is ran

		// add old reports to the database
		await database
			.getRepository(FAGCBan)
			.createQueryBuilder()
			.insert()
			.values(
				previousReports.map((report) => {
					return {
						id: report.id,
						playername: report.playername,
						communityId: report.communityId,
						categoryId: report.categoryId,
					}
				})
			)
			.execute()

		// run the actual function
		const results = await handleConnected({
			// we send in only the reports that have been created since the disconnect
			reports: [],
			// we send in only the reports that have been revoked since the disconnect
			revocations: [],
			database,
		})
		const databaseReports = await database.getRepository(FAGCBan).find()

		// ensure that players to ban and unban are correct
		expect(results.toBan.length).toBe(0)
		expect(results.toBan).toEqual([])

		expect(results.toUnban.length).toBe(0)
		expect(results.toUnban).toEqual([])

		// ensure that the database stores the right bans
		expect(databaseReports.length).toBe(previousReports.length)
		expect(databaseReports.map(simplifyDatabaseFAGCBan)).toEqual(
			previousReports.map(reportIntoFAGCBan)
		)
	})

	it("Should ban and unban people if reports are created and revoked", async () => {
		const previousReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: categoryIds,
					communityIds: communityIds,
				},
			],
			750
		)
		// create revocations from the reports that were created and valid
		const reportsToRevoke = randomElementsFromArray(previousReports, 250)
		const revokedReports = reportsToRevoke.map((report) =>
			createFAGCRevocation({
				report,
			})
		)

		const newReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: categoryIds,
					communityIds: communityIds,
				},
			],
			250
		)

		// assemble a list of new reports, some that are old and some that have been created
		const allNewReports = [
			...previousReports.filter(
				(report) => !revokedReports.find((x) => x.id === report.id)
			),
			...newReports,
		]

		const reportsByName = new Map<string, typeof allNewReports>()
		const alreadyBannedPlayers = new Set(
			previousReports.map((report) => report.playername)
		)
		const playersToUnban = new Set<string>()
		const playersToBan = new Set<string>()

		// figure out all of the data before the function is ran

		// add old reports to the database
		await database
			.getRepository(FAGCBan)
			.createQueryBuilder()
			.insert()
			.values(
				previousReports.map((report) => {
					return {
						id: report.id,
						playername: report.playername,
						communityId: report.communityId,
						categoryId: report.categoryId,
					}
				})
			)
			.execute()

		// add old reports to the map
		for (const report of previousReports) {
			const existing =
				reportsByName.get(report.playername) ||
				(reportsByName.set(report.playername, []) && [])
			existing.push(report)
			reportsByName.set(report.playername, existing)
		}
		// add in new reports to the map
		for (const report of allNewReports) {
			const existing =
				reportsByName.get(report.playername) ||
				(reportsByName.set(report.playername, []) && [])
			// ignore if the report is already in the map
			if (existing.find((r) => r.id === report.id)) continue
			existing.push(report)
			reportsByName.set(report.playername, existing)

			// if the player is already banned, we don't do anything
			// but if they aren't, we need to ban them
			if (!alreadyBannedPlayers.has(report.playername))
				playersToBan.add(report.playername)
		}
		// handle revocations
		for (const revocation of revokedReports) {
			const playerReports = reportsByName.get(revocation.playername) || []
			const unrevokedReports = playerReports.filter(
				(report) => report.id !== revocation.id
			)
			reportsByName.set(revocation.playername, unrevokedReports)

			// if the player has no reports that are valid, they should be unbanned
			if (
				unrevokedReports.length === 0 &&
				alreadyBannedPlayers.has(revocation.playername)
			)
				playersToUnban.add(revocation.playername)
		}

		// run the actual function
		const results = await handleConnected({
			// we send in only the reports that have been created since the disconnect
			reports: newReports,
			// we send in only the reports that have been revoked since the disconnect
			revocations: revokedReports,
			database,
		})
		const databaseReports = await database.getRepository(FAGCBan).find()

		// ensure that players to ban and unban are correct
		expect(results.toBan.length).toBe(playersToBan.size)
		expect(results.toBan).toEqual([...playersToBan])

		expect(results.toUnban.length).toBe(playersToUnban.size)
		expect(results.toUnban).toEqual([...playersToUnban])

		// ensure that the database stores the right bans
		expect(databaseReports.length).toBe(allNewReports.length)
		expect(databaseReports.map(simplifyDatabaseFAGCBan)).toEqual(
			allNewReports.map(reportIntoFAGCBan)
		)
	})
})
