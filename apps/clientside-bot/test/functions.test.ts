import { createConnection, Connection } from "typeorm"
import {
	guildConfigChangedBanlists,
	handleReport,
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
	createPrivateban,
	createTimes,
	createWhitelist,
	randomElementsFromArray,
	reportIntoFAGCBan,
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
	it("Should work with a combination of reports and revocations", async () => {
		// this would occur most likely only if the filters are managed directly with the api, rather than the discord bot
		const oldGuildConfig = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			categoryFilters: [
				...randomElementsFromArray(oldGuildConfig.categoryFilters),
				...randomElementsFromArray(
					categoryIds.filter(
						(id) => !oldGuildConfig.categoryFilters.includes(id)
					)
				),
			],
			trustedCommunities: [
				...randomElementsFromArray(oldGuildConfig.trustedCommunities),
				...randomElementsFromArray(
					communityIds.filter(
						(id) => !oldGuildConfig.trustedCommunities.includes(id)
					)
				),
			],
		}

		const playernames = createTimes(faker.internet.userName, 5000)

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

		// get all the reports into a single map
		const playersToBan = new Set<string>()
		const playersToUnban = new Set<string>()
		const [invalidOldReports, validOldReports] = oldReports.reduce<
			[Report[], Report[]]
		>(
			(all, report) => {
				// if a report is valid under new filters, it falls into the second array
				if (
					newGuildConfig.categoryFilters.includes(
						report.categoryId
					) &&
					newGuildConfig.trustedCommunities.includes(
						report.communityId
					)
				) {
					all[1].push(report)
				} else {
					all[0].push(report)
				}
				return all
			},
			[[], []]
		)
		invalidOldReports.forEach((report) =>
			playersToUnban.add(report.playername)
		)
		newReports.forEach((report) => {
			playersToBan.add(report.playername)
			playersToUnban.delete(report.playername)
		})
		validOldReports.forEach((report) => {
			playersToBan.delete(report.playername) // the player was banned before so shouldn't be banned again
			playersToUnban.delete(report.playername) // the player was banned so shouldn't be unbanned
		})
		invalidOldReports.forEach((report) =>
			playersToBan.delete(report.playername)
		) // if a player was banned before, it makes no sense to unban and ban

		const results = await guildConfigChangedBanlists({
			newConfig: newGuildConfig,
			validReports: [...validOldReports, ...newReports],
			database,
			allGuildConfigs: [newGuildConfig],
		})

		// the unbanned players should be the same
		expect(results.toUnban.length).toBe(playersToUnban.size) // april, wendel, elda, vivien
		expect(results.toUnban).toEqual([...playersToUnban])

		// the banned players should be the same
		expect(results.toBan.length).toBe(playersToBan.size)
		expect(results.toBan).toEqual([...playersToBan])
	})
	it("Should ensure that people who are whitelisted or blacklisted are not banned", async () => {
		// this test ensures that people are not banned uselessly if they are whitelisted or blacklisted
		const oldGuildConfig = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newGuildConfig: typeof oldGuildConfig = {
			...oldGuildConfig,
			categoryFilters: [
				...randomElementsFromArray(oldGuildConfig.categoryFilters),
				...randomElementsFromArray(
					categoryIds.filter(
						(id) => !oldGuildConfig.categoryFilters.includes(id)
					)
				),
			],
			trustedCommunities: [
				...randomElementsFromArray(oldGuildConfig.trustedCommunities),
				...randomElementsFromArray(
					communityIds.filter(
						(id) => !oldGuildConfig.trustedCommunities.includes(id)
					)
				),
			],
		}

		const playernames = createTimes(faker.internet.userName, 5000)

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

		const whitelists: Omit<Whitelist, "id">[] = createTimes(
			createWhitelist,
			[
				{
					playernames: playernames,
				},
			],
			5000
		).map((i) => {
			delete (i as any).id
			return i
		})
		const privateBans: Omit<PrivateBan, "id">[] = createTimes(
			createPrivateban,
			[
				{
					playernames: playernames,
				},
			],
			5000
		).map((i) => {
			delete (i as any).id
			return i
		})

		await database.getRepository(FAGCBan).insert(oldReports)
		for (const whitelist of splitIntoGroups(whitelists, 500)) {
			await database.getRepository(Whitelist).insert(whitelist)
		}
		for (const privateban of splitIntoGroups(privateBans, 500)) {
			await database.getRepository(PrivateBan).insert(privateban)
		}

		// get all the reports into a single map
		const playersToBan = new Set<string>()
		const playersToUnban = new Set<string>()
		const [invalidOldReports, validOldReports] = oldReports.reduce<
			[Report[], Report[]]
		>(
			(all, report) => {
				// if a report is valid under new filters, it falls into the second array
				if (
					newGuildConfig.categoryFilters.includes(
						report.categoryId
					) &&
					newGuildConfig.trustedCommunities.includes(
						report.communityId
					)
				) {
					all[1].push(report)
				} else {
					all[0].push(report)
				}
				return all
			},
			[[], []]
		)
		invalidOldReports.forEach((report) =>
			playersToUnban.add(report.playername)
		)
		newReports.forEach((report) => {
			playersToBan.add(report.playername)
			playersToUnban.delete(report.playername)
		})
		validOldReports.forEach((report) => {
			playersToBan.delete(report.playername) // the player was banned before so shouldn't be banned again
			playersToUnban.delete(report.playername) // the player was banned so shouldn't be unbanned
		})
		invalidOldReports.forEach((report) =>
			playersToBan.delete(report.playername)
		) // if a player was banned before, it makes no sense to unban and ban
		// players that are blacklisted or whitelisted should be ignored from lists
		whitelists.map((whitelist) => {
			playersToBan.delete(whitelist.playername)
			playersToUnban.delete(whitelist.playername)
		})
		privateBans.map((privateban) => {
			playersToBan.delete(privateban.playername)
			playersToUnban.delete(privateban.playername)
		})

		const results = await guildConfigChangedBanlists({
			newConfig: newGuildConfig,
			validReports: [...validOldReports, ...newReports],
			database,
			allGuildConfigs: [newGuildConfig],
		})

		// the unbanned players should be the same
		expect(results.toUnban.length).toBe(playersToUnban.size) // april, wendel, elda, vivien
		expect(results.toUnban).toEqual([...playersToUnban])

		// the banned players should be the same
		expect(results.toBan.length).toBe(playersToBan.size)
		expect(results.toBan).toEqual([...playersToBan])
	})
})
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
	it("Should ban a player if the report is valid in a single guild", async () => {
		const guildConfig = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
			categoryIds: guildConfig.categoryFilters,
			communityIds: guildConfig.trustedCommunities,
		})

		const results = await handleReport({
			report,
			database,
			allGuildConfigs: [guildConfig],
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be an array of guild IDs rather than false
		expect(results).not.toBe(false)
		expect(results).toBeInstanceOf(Array)
		expect(results).toEqual([guildConfig.guildId])
		// there should be only one ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})
	it("Should ban a player in multiple guilds if the report is valid in multiple guilds", async () => {
		const guildConfigs = createTimes(
			createGuildConfig,
			[
				{
					categoryIds,
					communityIds,
					includeAllFilters: true,
				},
			],
			// create only 10 because it is useless to have more
			10
		)
		const report = createFAGCReport({
			// the filters are the same across all guilds
			categoryIds: guildConfigs[0].categoryFilters,
			communityIds: guildConfigs[0].trustedCommunities,
		})

		const results = await handleReport({
			report,
			database,
			allGuildConfigs: guildConfigs,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be an array of guild IDs rather than false
		expect(results).not.toBe(false)
		expect(results).toBeInstanceOf(Array)
		// the results should be the same as the guild IDs, as the report is valid in all guilds
		expect(results).toEqual(guildConfigs.map((x) => x.guildId))
		// there should be only one ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})
	it("Should ban only in some guilds if the report is valid in only some guilds", async () => {
		const guildConfigs = createTimes(
			createGuildConfig,
			[
				{
					categoryIds,
					communityIds,
				},
			],
			10
		)

		const report = createFAGCReport({
			categoryIds: guildConfigs[0].categoryFilters,
			communityIds: guildConfigs[0].trustedCommunities,
		})

		const reportValidIn = guildConfigs.reduce<string[]>(
			(validIn, config) => {
				// if the report is valid in the guild, add the guild ID to the array
				if (
					config.categoryFilters.includes(report.categoryId) &&
					config.trustedCommunities.includes(report.communityId)
				) {
					validIn.push(config.guildId)
				}

				return validIn
			},
			[]
		)

		const results = await handleReport({
			report,
			database,
			allGuildConfigs: guildConfigs,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be an array of guild IDs rather than false
		expect(results).not.toBe(false)
		expect(results).toBeInstanceOf(Array)
		// the results should be the same as the guild IDs in which the report is valid
		expect(results).toEqual(reportValidIn)
		// there should be only one ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})
	it("Should not ban if the player already has an existing report in the database", async () => {
		const guildConfigs = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const [oldReport, newReport] = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: guildConfigs.categoryFilters,
					communityIds: guildConfigs.trustedCommunities,
					// to ensure that the playername is identical
					playernames: [faker.internet.userName()],
				},
			],
			2
		)

		await database.getRepository(FAGCBan).insert(oldReport)

		const results = await handleReport({
			report: newReport,
			database,
			allGuildConfigs: [guildConfigs],
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be an array of guild IDs rather than false
		expect(results).not.toBe(false)
		expect(results).toBeInstanceOf(Array)
		// the array should be blank, as the player is banned already
		expect(results).toEqual([])
		// there should be two bans in the database, which are equal to the simplified reports
		expect(foundInDatabase.length).toBe(2)
		expect(foundInDatabase).toEqual([
			reportIntoFAGCBan(oldReport),
			reportIntoFAGCBan(newReport),
		])
	})
	it("Should not ban a player if they are whitelisted", async () => {
		const guildConfigs = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
			categoryIds: guildConfigs.categoryFilters,
			communityIds: guildConfigs.trustedCommunities,
		})

		await database.getRepository(Whitelist).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleReport({
			report,
			database,
			allGuildConfigs: [guildConfigs],
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be an array of guild IDs rather than false
		expect(results).not.toBe(false)
		expect(results).toBeInstanceOf(Array)
		// the array should be blank, as the player is ignored
		expect(results).toEqual([])
		// there should be a ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})
	it("Should not ban a player if they are private banned", async () => {
		const guildConfigs = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
			categoryIds: guildConfigs.categoryFilters,
			communityIds: guildConfigs.trustedCommunities,
		})

		await database.getRepository(PrivateBan).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleReport({
			report,
			database,
			allGuildConfigs: [guildConfigs],
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be an array of guild IDs rather than false
		expect(results).not.toBe(false)
		expect(results).toBeInstanceOf(Array)
		// the array should be blank, as the player is ignored
		expect(results).toEqual([])
		// there should be a ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})
})

/*
	[ ] add some form of a "active" field to FAGCBan so that it can be known if a ban was handled or not
		could potentially be useful if a privateban/whitelist is removed
		bans are however stored in the database if they correspond to at least one guild's filters, so they don't need to be fetched again
	[ ] add handling for new reports and new revocations
*/
