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
	createFAGCReport,
	createGuildConfig,
	createTimes,
	randomElementsFromArray,
} from "./utils"

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
	})
	afterEach(async () => {
		await database.close()
	})
	it("Should create the same amount of bans as provided reports if all reports are acknowledged", async () => {
		const categories = createTimes(createFAGCCategory, 1000)
		const categoryIds = categories.map((x) => x.id)
		const communities = createTimes(createFAGCCategory, 1000)
		const communityIds = communities.map((x) => x.id)

		const oldGuildConfig = createGuildConfig({
			categoryIds: [], // these fields are irrelevant in this test, as there are no pre-existing bans
			communityIds: [],
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			categoryFilters: randomElementsFromArray(categoryIds),
			trustedCommunities: randomElementsFromArray(communityIds),
		}

		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newGuildConfig.categoryFilters,
					communityIds: newGuildConfig.trustedCommunities,
				},
			],
			500
		)

		await guildConfigChangedBanlists({
			oldConfig: oldGuildConfig,
			newConfig: newGuildConfig,
			database: database,
			allGuildConfigs: [newGuildConfig],
			filteredReports: reports,
		})
		// the amount of FAGC bans should be equal to the amount of reports, as each report should be banned
		// since all reports are acknowledged by the filters
		const foundFAGCBans = await database.getRepository(FAGCBan).find()
		expect(foundFAGCBans.length).toBe(reports.length)
		// expect the names of banned players to be the same
		expect(foundFAGCBans.map((x) => x.playername)).toEqual(
			reports.map((x) => x.playername)
		)
		// except the found bans to be same as the filtereds reports (except for some values which are excluded on the FAGCBan type)
		expect(foundFAGCBans).toEqual(
			reports.map<typeof foundFAGCBans[0]>((report) => {
				return {
					id: report.id,
					playername: report.playername,
					communityId: report.communityId,
					categoryId: report.categoryId,
				}
			})
		)
	})
	it("Should create a smaller amount of bans than provided reports if only some reports are acknowledged", async () => {
		const categories = createTimes(createFAGCCategory, 1000)
		const categoryIds = categories.map((x) => x.id)
		const communities = createTimes(createFAGCCategory, 1000)
		const communityIds = communities.map((x) => x.id)

		const oldGuildConfig = createGuildConfig({
			categoryIds: [], // these fields are irrelevant in this test, as there are no pre-existing bans
			communityIds: [],
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			categoryFilters: randomElementsFromArray(categoryIds),
			trustedCommunities: randomElementsFromArray(communityIds),
		}

		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newGuildConfig.categoryFilters,
					communityIds: newGuildConfig.trustedCommunities,
				},
			],
			500
		)

		await guildConfigChangedBanlists({
			oldConfig: oldGuildConfig,
			newConfig: newGuildConfig,
			database: database,
			allGuildConfigs: [newGuildConfig],
			filteredReports: reports,
		})
		// the amount of FAGC bans should be equal to the amount of reports, as each report should be banned
		// since all reports are acknowledged by the filters
		const foundFAGCBans = await database.getRepository(FAGCBan).find()
		const filteredReports = reports.filter((report) => {
			// check if the community is trusted and the category is in the filter
			return (
				newGuildConfig.trustedCommunities.includes(
					report.communityId
				) && newGuildConfig.categoryFilters.includes(report.categoryId)
			)
		})
		expect(foundFAGCBans.length).toBe(filteredReports.length)
		// expect the names of banned players to be the same
		expect(foundFAGCBans.map((x) => x.playername)).toEqual(
			filteredReports.map((x) => x.playername)
		)
		// except the found bans to be same as the filtereds reports (except for some values which are excluded on the FAGCBan type)
		expect(foundFAGCBans).toEqual(
			filteredReports.map<typeof foundFAGCBans[0]>((report) => {
				return {
					id: report.id,
					playername: report.playername,
					communityId: report.communityId,
					categoryId: report.categoryId,
				}
			})
		)
	})
	it("Should ban smaller amounts of people if some reports are already banned for", async () => {
		// the goal here is to check that the return of the value banlistResults.toBan totals to the amount of reports that have already
		// been handled (are created in the databse), so people that have already been banned should not be banned again
		const categories = createTimes(createFAGCCategory, 100)
		const categoryIds = categories.map((x) => x.id)
		const communities = createTimes(createFAGCCategory, 100)
		const communityIds = communities.map((x) => x.id)

		// the goal here is to create two configs, one that has only 10 filters for each, and another one that has *additional* filters
		// this will make sure that some of the reports were already handled by the old guild config, whilst other ones are handled by the new one
		// this simulates a real life situation when rules/community filters are added
		const oldGuildConfig = createGuildConfig({
			categoryIds: randomElementsFromArray(categoryIds, 25), // these fields are irrelevant in this test, as there are no pre-existing bans
			communityIds: randomElementsFromArray(communityIds, 25),
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			// we filter the options from which the function may select the additional filters to ensure that
			// the new config has more filters than the old one
			categoryFilters: [
				...oldGuildConfig.categoryFilters,
				...randomElementsFromArray(
					categoryIds.filter(
						(id) => !oldGuildConfig.categoryFilters.includes(id)
					),
					25
				),
			],
			trustedCommunities: [
				...oldGuildConfig.trustedCommunities,
				...randomElementsFromArray(
					communityIds.filter(
						(id) => !oldGuildConfig.trustedCommunities.includes(id)
					),
					25
				),
			],
		}

		const oldReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: oldGuildConfig.categoryFilters,
					communityIds: oldGuildConfig.trustedCommunities,
				},
			],
			500
		)
		const newReports = createTimes(
			createFAGCReport,
			[
				{
					// we filter the new rules here so that we make sure that the reports consist of ONLY the new category and community filters
					// simulates when rule filters are added
					categoryIds: newGuildConfig.categoryFilters.filter(
						(x) => !oldGuildConfig.categoryFilters.includes(x)
					),
					communityIds: newGuildConfig.trustedCommunities.filter(
						(x) => !oldGuildConfig.trustedCommunities.includes(x)
					),
				},
			],
			500
		)

		const allReports = [...oldReports, ...newReports]

		// insert the reports of the old config
		await database.getRepository(FAGCBan).insert(oldReports)

		// run the function with all of the reports
		const results = await guildConfigChangedBanlists({
			oldConfig: oldGuildConfig,
			newConfig: newGuildConfig,
			database: database,
			allGuildConfigs: [newGuildConfig],
			filteredReports: allReports,
		})

		const foundFAGCBans = await database.getRepository(FAGCBan).find()

		// check that the total amount of FAGC bans is the same as the total amount of reports
		expect(foundFAGCBans.length).toBe(allReports.length)

		// check that the amount of people banned by the function is equal to the amount of new reports
		expect(results.toBan.length).toBe(newReports.length)
		// expect that the names of the players banned are the same as the names of the new reports
		expect([...results.toBan]).toEqual(newReports.map((x) => x.playername))
	})
})
