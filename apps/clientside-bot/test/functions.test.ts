import { createConnection, Connection } from "typeorm"
import {
	filterObjectChangedBanlists,
	handleReport,
	handleRevocation,
	splitIntoGroups,
	handleConnected,
	hasFAGCBans,
} from "../src/utils/functions"
import BotConfig from "../src/database/BotConfig"
import FAGCBan from "../src/database/FAGCBan"
import InfoChannel from "../src/database/InfoChannel"
import PrivateBan from "../src/database/PrivateBan"
import Whitelist from "../src/database/Whitelist"
import {
	createFAGCCategory,
	createFAGCCommunity,
	createFAGCReport,
	createFAGCRevocation,
	createGuildConfig,
	createPrivateban,
	createTimes,
	createWhitelist,
	randomElementsFromArray,
	reportIntoFAGCBan,
} from "./utils"
import {
	Category,
	Community,
	FilterObject,
	GuildConfig,
	Report,
} from "fagc-api-types"
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
	it("Should split a large array into two partially filled ones if the amount of elements isn't divisible by the limit", () => {
		const items = new Array(750).fill(0)
		const groups = splitIntoGroups(items, 500)
		expect(groups.length).toBe(2)
		expect(groups[0].length).toBe(500)
		expect(groups[1].length).toBe(250)
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
	it("Should create bans for reports that have just been included in the filters", async () => {
		const [guildConfig, oldFilterObject] = createGuildConfig({
			categoryIds: [],
			communityIds: [],
		})
		const newFilterObject: typeof oldFilterObject = {
			...oldFilterObject,
			categoryFilters: categoryIds,
			communityFilters: communityIds,
		}

		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newFilterObject.categoryFilters,
					communityIds: newFilterObject.communityFilters,
				},
			],
			5000
		)

		const results = await filterObjectChangedBanlists({
			newFilter: newFilterObject,
			validReports: reports,
			database,
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
		const [guildConfig, oldFilterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newFilterObject: typeof oldFilterObject = {
			...oldFilterObject,
			categoryFilters: [],
			communityFilters: [],
		}

		const reports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: oldFilterObject.categoryFilters,
					communityIds: oldFilterObject.communityFilters,
				},
			],
			5000
		)

		await database.getRepository(FAGCBan).insert(reports)

		const results = await filterObjectChangedBanlists({
			newFilter: newFilterObject,
			validReports: [],
			database,
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

		const [guildConfig, oldFilterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newFilterObject: typeof oldFilterObject = {
			...oldFilterObject,
			categoryFilters: [
				...oldFilterObject.categoryFilters,
				...randomElementsFromArray(
					categoryIds.filter(
						(x) => !oldFilterObject.categoryFilters.includes(x)
					),
					20
				),
			],
			communityFilters: [
				...oldFilterObject.communityFilters,
				...randomElementsFromArray(
					communityIds.filter(
						(x) => !oldFilterObject.communityFilters.includes(x)
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
					categoryIds: oldFilterObject.categoryFilters,
					communityIds: oldFilterObject.communityFilters,
					playernames: playernames,
				},
			],
			5000
		)
		const newReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newFilterObject.categoryFilters,
					communityIds: newFilterObject.communityFilters,
					playernames: playernames,
				},
			],
			5000
		)

		await database.getRepository(FAGCBan).insert(oldReports)

		const results = await filterObjectChangedBanlists({
			newFilter: newFilterObject,
			validReports: [...newReports, ...oldReports],
			database,
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
		const [guildConfig, oldFilterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newFilterObject: typeof oldFilterObject = {
			...oldFilterObject,
			categoryFilters: [
				...randomElementsFromArray(oldFilterObject.categoryFilters),
				...randomElementsFromArray(
					categoryIds.filter(
						(id) => !oldFilterObject.categoryFilters.includes(id)
					)
				),
			],
			communityFilters: [
				...randomElementsFromArray(oldFilterObject.communityFilters),
				...randomElementsFromArray(
					communityIds.filter(
						(id) => !oldFilterObject.communityFilters.includes(id)
					)
				),
			],
		}

		const playernames = createTimes(faker.internet.userName, 5000)

		const oldReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: oldFilterObject.categoryFilters,
					communityIds: oldFilterObject.communityFilters,
					playernames: playernames,
				},
			],
			5000
		)
		const newReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newFilterObject.categoryFilters,
					communityIds: newFilterObject.communityFilters,
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
					newFilterObject.categoryFilters.includes(
						report.categoryId
					) &&
					newFilterObject.communityFilters.includes(
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

		const results = await filterObjectChangedBanlists({
			newFilter: newFilterObject,
			validReports: [...validOldReports, ...newReports],
			database,
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
		const [guildConfig, oldFilterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})
		const newFilterObject: typeof oldFilterObject = {
			...oldFilterObject,
			categoryFilters: [
				...randomElementsFromArray(oldFilterObject.categoryFilters),
				...randomElementsFromArray(
					categoryIds.filter(
						(id) => !oldFilterObject.categoryFilters.includes(id)
					)
				),
			],
			communityFilters: [
				...randomElementsFromArray(oldFilterObject.communityFilters),
				...randomElementsFromArray(
					communityIds.filter(
						(id) => !oldFilterObject.communityFilters.includes(id)
					)
				),
			],
		}

		const playernames = createTimes(faker.internet.userName, 5000)

		const oldReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: oldFilterObject.categoryFilters,
					communityIds: oldFilterObject.communityFilters,
					playernames: playernames,
				},
			],
			5000
		)
		const newReports = createTimes(
			createFAGCReport,
			[
				{
					categoryIds: newFilterObject.categoryFilters,
					communityIds: newFilterObject.communityFilters,
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
					newFilterObject.categoryFilters.includes(
						report.categoryId
					) &&
					newFilterObject.communityFilters.includes(
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

		const results = await filterObjectChangedBanlists({
			newFilter: newFilterObject,
			validReports: [...validOldReports, ...newReports],
			database,
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

	it("Should ban a player if the report is valid", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		const results = await handleReport({
			report,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be true as the player should be banned
		expect(results).toBe(true)
		// there should be only one ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})

	it("Should not ban if the player already has an existing report in the database", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const [oldReport, newReport] = createTimes(
			createFAGCReport,
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

		await database.getRepository(FAGCBan).insert(oldReport)

		const results = await handleReport({
			report: newReport,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// the result should be false, as the player is already banned
		expect(results).toBe(false)
		// there should be two bans in the database, which are equal to the simplified reports
		expect(foundInDatabase.length).toBe(2)
		expect(foundInDatabase).toEqual([
			reportIntoFAGCBan(oldReport),
			reportIntoFAGCBan(newReport),
		])
	})

	it("Should not ban a player if they are whitelisted", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
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

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be false as the player is to not be banned
		expect(results).toBe(false)
		// there should be a ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})

	it("Should not ban a player if they are private banned", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
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

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be false, as the player is private banned and shouldnt be banned again
		expect(results).toBe(false)
		// there should be a ban in the database, which is equal to the simplified report
		expect(foundInDatabase.length).toBe(1)
		expect(foundInDatabase[0]).toEqual(reportIntoFAGCBan(report))
	})
})

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

	it("Should revoke a player's report if the report is valid", async () => {
		const [guildConfig, filterObject] = createGuildConfig({
			categoryIds,
			communityIds,
		})

		const report = createFAGCReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		await database.getRepository(FAGCBan).insert(report)

		const revocation = createFAGCRevocation({ report })

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

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
			createFAGCReport,
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

		await database.getRepository(FAGCBan).insert([oldReport, newReport])

		const revocation = createFAGCRevocation({ report: newReport })

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

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

		const report = createFAGCReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		const revocation = createFAGCRevocation({ report })

		await database.getRepository(FAGCBan).insert(report)
		await database.getRepository(Whitelist).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

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

		const report = createFAGCReport({
			categoryIds: filterObject.categoryFilters,
			communityIds: filterObject.communityFilters,
		})

		const revocation = createFAGCRevocation({ report })

		await database.getRepository(FAGCBan).insert(report)
		await database.getRepository(PrivateBan).insert({
			playername: report.playername,
			adminId: "123",
		})

		const results = await handleRevocation({
			revocation,
			database,
			filter: filterObject,
		})

		const foundInDatabase = await database.manager.find(FAGCBan)

		// should be false, as the player is private banned and shouldnt be affected by FAGC bans
		expect(results).toBe(false)
		// there should be no reports in the database
		expect(foundInDatabase.length).toBe(0)
	})
})

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
			1000
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
		expect(databaseReports).toEqual(
			previousReports.map((report) => ({
				id: report.id,
				playername: report.playername,
				communityId: report.communityId,
				categoryId: report.categoryId,
			}))
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
			1000
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
		expect(databaseReports).toEqual(
			allNewReports.map((report) => ({
				id: report.id,
				playername: report.playername,
				communityId: report.communityId,
				categoryId: report.categoryId,
			}))
		)
	})
})

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
		expect(result).toEqual(reportIntoFAGCBan(report))
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
