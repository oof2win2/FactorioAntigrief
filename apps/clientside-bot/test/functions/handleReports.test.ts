import { createConnection, Connection } from "typeorm"
import handleReport from "../../src/utils/functions/handleReport"
import BotConfig from "../../src/database/BotConfig"
import FDGLBan from "../../src/database/FDGLBan"
import InfoChannel from "../../src/database/InfoChannel"
import PrivateBan from "../../src/database/PrivateBan"
import Whitelist from "../../src/database/Whitelist"
import {
	createFDGLCategory,
	createFDGLCommunity,
	createFDGLReport,
	createGuildConfig,
	createTimes,
	reportIntoFDGLBan,
} from "../utils"
import { Category, Community } from "@fdgl/types"
import faker from "faker"

describe("handleReport", () => {
	let database: Connection
	let categories: Category[]
	let categoryIds: string[]
	let communities: Community[]
	let communityIds: string[]

	beforeEach(async () => {
		database = await createConnection({
			type: "better-sqlite3",
			database: ":memory:",
			entities: [FDGLBan, InfoChannel, BotConfig, PrivateBan, Whitelist],
			synchronize: true,
		})
		categories = createTimes(createFDGLCategory, 100)
		categoryIds = categories.map((x) => x.id)
		communities = createTimes(createFDGLCommunity, 100)
		communityIds = communities.map((x) => x.id)
	})

	afterEach(async () => {
		await database.close()
	})

	it("Should ban a player if the report is valid", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFDGLReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		const results = await handleReport({
			report,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// should be true as the player should be banned
		expect(results).toBe(true)
		// there should be only one ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(
			expect.objectContaining(reportIntoFDGLBan(report))
		)
	})

	it("Should not ban if the player already has an existing report in the database", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const [oldReport, newReport] = createTimes(
			createFDGLReport,
			[
				{
					categoryIds: filterObject.categoryFilters,
					communityIds: filterObject.communityFilters,
					// to ensure that the playername is identical
					playernames: [faker.internet.userName()],
				},
			],
			2
		)

		await database.getRepository(FDGLBan).insert({
			...oldReport,
			adminId: oldReport.adminId,
			createdAt: oldReport.reportCreatedAt,
		})

		const results = await handleReport({
			report: newReport,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// the result should be false, as the player is already banned
		expect(results).toBe(false)
		// there should be two bans in the database, which are equal to the simplified reports
		expect(foundInDatabase.length).toBe(2)
		expect(foundInDatabase).toEqual([
			expect.objectContaining(reportIntoFDGLBan(oldReport)),
			expect.objectContaining(reportIntoFDGLBan(newReport)),
		])
	})

	it("Should not ban a player if they are whitelisted", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFDGLReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		await database.getRepository(Whitelist).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleReport({
			report,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// should be false as the player is to not be banned
		expect(results).toBe(false)
		// there should be a ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(
			expect.objectContaining(reportIntoFDGLBan(report))
		)
	})

	it("Should not ban a player if they are private banned", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFDGLReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		await database.getRepository(PrivateBan).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleReport({
			report,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// should be false, as the player is private banned and shouldnt be banned again
		expect(results).toBe(false)
		// there should be a ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(
			expect.objectContaining(reportIntoFDGLBan(report))
		)
	})
})
