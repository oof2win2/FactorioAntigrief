import { createConnection, Connection } from "typeorm"
import hasFDGLBans from "../../src/utils/functions/hasFDGLBans"
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
	simplifyDatabaseFDGLBan,
} from "../utils"
import { Category, Community } from "@fdgl/types"

describe("hasFDGLBans", () => {
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

	it("Should state that a player should be banned if there is a valid report against them", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFDGLReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		await database.getRepository(FDGLBan).insert({
			...report,
			createdAt: report.reportCreatedAt,
		})

		const result = await hasFDGLBans({
			playername: report.playername,
			database,
			filter: filterObject,
		})

		// the result should not be false, as that would mean that the player should not be banned
		expect(result).not.toBe(false)
		// the result should be equal to the simplified report
		expect(simplifyDatabaseFDGLBan(result)).toEqual(
			reportIntoFDGLBan(report)
		)
	})

	it("Should state that a player should not be banned if there are no valid reports against them", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const result = await hasFDGLBans({
			playername: "some random playername",
			database,
			filter: filterObject,
		})

		// the result should be false, as that means that the player should not be banned
		expect(result).toBe(false)
	})
})
