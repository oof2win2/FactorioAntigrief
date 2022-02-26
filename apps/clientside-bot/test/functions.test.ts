import { createConnection, Connection } from "typeorm"
import {
	guildConfigChangedBanlists,
	splitIntoGroups,
} from "../src/utils/functions"
import BotConfig from "../src/database/BotConfig"
import Command from "../src/database/Command"
import FAGCBan from "../src/database/FAGCBan"
import InfoChannel from "../src/database/InfoChannel"
import PrivateBan from "../src/database/PrivateBan"
import Whitelist from "../src/database/Whitelist"
import {
	createFAGCCategory,
	createFAGCCommunity,
	createFAGCReport,
	createGuildConfig,
	createTimes,
	randomElementsFromArray,
} from "./utils"
import { Category, Community, Report } from "fagc-api-types"
import faker from "faker"

describe("splitIntoGroups", () => {
	it("Should split a large array two smaller ones of an equal size", () => {
		const items = new Array(1000).fill(0)
		const groups = splitIntoGroups(items, 500)
		expect(groups.length).toBe(2)
		expect(groups[0].length).toBe(500)
		expect(groups[1].length).toBe(500)
	})
	it("Should split a large array into multiple smaller ones if a smaller maxSize is provided", () => {
		const items = new Array(1000).fill(0)
		const groups = splitIntoGroups(items, 100)
		expect(groups.length).toBe(10)
		for (const group of groups) {
			expect(group.length).toBe(100)
		}
	})
	it("Should keep the original values of the inital array", () => {
		const items = Array.from({ length: 1000 }, () =>
			Math.floor(Math.random() * 10)
		)
		const groups = splitIntoGroups(items, 100)
		expect(groups.flat()).toEqual(items)
	})
})

describe("guildConfigChangedBanlists", () => {
	let database: Connection
	let categories: Category[]
	let categoryIds: string[]
	let communities: Community[]
	let communityIds: string[]
	beforeEach(async () => {
		database = await createConnection({
			type: "better-sqlite3",
			database: ":memory:",
			entities: [
				FAGCBan,
				InfoChannel,
				BotConfig,
				PrivateBan,
				Whitelist,
				Command,
			],
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
	it("Should create bans for reports that have just been included in the filters", async () => {
		const oldGuildConfig = createGuildConfig({
			categoryIds: [],
			communityIds: [],
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			categoryFilters: categoryIds,
			trustedCommunities: communityIds,
		}

		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newGuildConfig.categoryFilters,
					communityIds: newGuildConfig.trustedCommunities,
				},
			],
			5000
		)

		const results = await guildConfigChangedBanlists({
			oldConfig: oldGuildConfig,
			newConfig: newGuildConfig,
			validReports: reports,
			database,
			allGuildConfigs: [newGuildConfig],
		})

		const fetchedFAGCBans = await database.getRepository(FAGCBan).find()

		const allReportPlayernames = [
			...new Set(reports.map((report) => report.playername)),
		]
		// the function should ban everyone there is a report against
		expect(results.toBan.length).toBe(allReportPlayernames.length)
		expect(results.toBan).toEqual(allReportPlayernames)

		// there should be a record for each report
		const fagcBanIds = fetchedFAGCBans.map((ban) => ban.id)
		const reportIds = reports.map((report) => report.id)
		expect(fetchedFAGCBans.length).toBe(reports.length)
		expect(fagcBanIds).toEqual(reportIds)
	})
	it("Should unban everyone if all filters are removed", async () => {
		const oldGuildConfig = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			categoryFilters: [],
			trustedCommunities: [],
		}

		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: oldGuildConfig.categoryFilters,
					communityIds: oldGuildConfig.trustedCommunities,
				},
			],
			5000
		)

		await database.getRepository(FAGCBan).insert(reports)

		const results = await guildConfigChangedBanlists({
			oldConfig: oldGuildConfig,
			newConfig: newGuildConfig,
			validReports: [],
			database,
			allGuildConfigs: [newGuildConfig],
		})

		const fetchedFAGCBans = await database.getRepository(FAGCBan).find()

		// the function should unban everyone there is a report against
		const allPlayers = [
			...new Set(reports.map((report) => report.playername)),
		]
		expect(results.toUnban.length).toBe(allPlayers.length)
		expect(results.toUnban).toEqual(allPlayers)

		// there should be no records of FAGC bans in the database, as they were all supposed to be removed
		expect(fetchedFAGCBans.length).toBe(0)
	})
	it("Should not re-ban players that are already banned", async () => {
		// this can occur if some filters are added to a config
		// the goal here is to check that the return of the value banlistResults.toBan totals to the amount of reports that have already
		// been handled (are created in the databse), so people that have already been banned should not be banned again
		const categories = createTimes(createFAGCCategory, 100)
		const categoryIds = categories.map((x) => x.id)
		const communities = createTimes(createFAGCCategory, 100)
		const communityIds = communities.map((x) => x.id)

		const oldGuildConfig = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			categoryFilters: [
				...oldGuildConfig.categoryFilters,
				...randomElementsFromArray(
					categoryIds.filter(
						(x) => !oldGuildConfig.categoryFilters.includes(x)
					),
					20
				),
			],
			trustedCommunities: [
				...oldGuildConfig.trustedCommunities,
				...randomElementsFromArray(
					communityIds.filter(
						(x) => !oldGuildConfig.trustedCommunities.includes(x)
					),
					20
				),
			],
		}

		// 5500 is chosen because under any circumstances, there should be some unique names and some repeated names
		// across the two arrays
		const playernames = createTimes(faker.internet.userName, 5500)
		const oldReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: oldGuildConfig.categoryFilters,
					communityIds: oldGuildConfig.trustedCommunities,
					playernames: playernames,
				},
			],
			5000
		)
		const newReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newGuildConfig.categoryFilters,
					communityIds: newGuildConfig.trustedCommunities,
					playernames: playernames,
				},
			],
			5000
		)

		await database.getRepository(FAGCBan).insert(oldReports)

		const results = await guildConfigChangedBanlists({
			oldConfig: oldGuildConfig,
			newConfig: newGuildConfig,
			validReports: [...newReports, ...oldReports],
			database,
			allGuildConfigs: [newGuildConfig],
		})

		const expectedBans = new Set<string>()
		// compile a list of people that should be banned with the new reports
		// excludes the people that have been banned with the old reports
		newReports.forEach((report) => expectedBans.add(report.playername))
		oldReports.forEach((report) => expectedBans.delete(report.playername))

		// the function shouldn't re-ban people that are already banned
		expect(results.toBan.length).toBe(expectedBans.size)
		expect(results.toBan).toEqual([...expectedBans])
	})
})
