import { createConnection, Connection } from "typeorm"
import handleRevocation from "../../src/utils/functions/handleRevocation"
import BotConfig from "../../src/database/BotConfig"
import FDGLBan from "../../src/database/FDGLBan"
import InfoChannel from "../../src/database/InfoChannel"
import PrivateBan from "../../src/database/PrivateBan"
import Whitelist from "../../src/database/Whitelist"
import {
	createFDGLCategory,
	createFDGLCommunity,
	createFDGLReport,
	createFDGLRevocation,
	createGuildConfig,
	createTimes,
} from "../utils"
import { Category, Community } from "@fdgl/types"
import faker from "faker"

describe("handleRevocation", () => {
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

	it("Should revoke a player's report if the report is valid", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFDGLReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		await database.getRepository(FDGLBan).insert(report)

		const revocation = createFDGLRevocation({ report })

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// there should be no records in the database, as the report should have been deleted
		expect(foundInDatabase.length).toBe(0)
		// the result should be true, as the player is supposed to be unbanned
		expect(results).toBe(true)
	})

	it("Should not unban the player if the player has another report in the database", async () => {
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

		await database.getRepository(FDGLBan).insert([oldReport, newReport])

		const revocation = createFDGLRevocation({ report: newReport })

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// the record of the original report should be removed from the database, as it is now unbaned
		expect(foundInDatabase.length).toBe(1)
		// the results should be false, as the player is still banned by the other report
		expect(results).toBe(false)
	})

	it("Should not unban a player if they are whitelisted", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFDGLReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		const revocation = createFDGLRevocation({ report })

		await database.getRepository(FDGLBan).insert(report)
		await database.getRepository(Whitelist).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// should be false, as the player is whitelisted so the system should not interact with whitelisted players
		expect(results).toBe(false)
		// there should be no reports in the database
		expect(foundInDatabase.length).toBe(0)
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

		const revocation = createFDGLRevocation({ report })

		await database.getRepository(FDGLBan).insert(report)
		await database.getRepository(PrivateBan).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FDGLBan)

		// should be false, as the player is private banned and shouldnt be affected by FDGL bans
		expect(results).toBe(false)
		// there should be no reports in the database
		expect(foundInDatabase.length).toBe(0)
	})
})
