import { createConnection, Connection } from "typeorm"
import hasFAGCBans from "../../src/utils/functions/hasFAGCBans"
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
	reportIntoFAGCBan,
	simplifyDatabaseFAGCBan,
} from "../utils"
import { Category, Community } from "fagc-api-types"

describe("hasFAGCBans", () => {
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

	it("Should state that a player should be banned if there is a valid report against them", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		await database.getRepository(FAGCBan).insert(report)

		const result = await hasFAGCBans({
			playername: report.playername,
			database,
			filter: filterObject,
		})

		// the result should not be false, as that would mean that the player should not be banned
		expect(result).not.toBe(false)
		// the result should be equal to the simplified report
		expect(simplifyDatabaseFAGCBan(result)).toEqual(
			reportIntoFAGCBan(report)
		)
	})

	it("Should state that a player should not be banned if there are no valid reports against them", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const result = await hasFAGCBans({
			playername: "some random playername",
			database,
			filter: filterObject,
		})

		// the result should be false, as that means that the player should not be banned
		expect(result).toBe(false)
	})
})
