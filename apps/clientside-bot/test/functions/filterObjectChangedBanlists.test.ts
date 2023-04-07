import { createConnection, Connection } from "typeorm"
import filterObjectChangedBanlists from "../../src/utils/functions/filterObjectChangedBanlists"
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
	randomElementsFromArray,
	createPrivateban,
	createWhitelist,
} from "../utils"
import { Category, Community, Report } from "@fdgl/types"
import faker from "faker"

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
			entities: [FDGLBan, InfoChannel, BotConfig, PrivateBan, Whitelist],
			synchronize: true,
			// logging: true,
		})
		categories = createTimes(createFDGLCategory, 100)
		categoryIds = categories.map((x) => x.id)
		communities = createTimes(createFDGLCommunity, 100)
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
			createFDGLReport,
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

		const fetchedFDGLBans = await database.getRepository(FDGLBan).find()

		const allReportPlayernames = [
			...new Set(reports.map((report) => report.playername)),
		]
		// the function should ban everyone there is a report against
		expect(results.toBan.length).toBe(allReportPlayernames.length)
		expect(results.toBan).toEqual(allReportPlayernames)

		// there should be a record for each report
		const fdglBanIds = fetchedFDGLBans.map((ban) => ban.id)
		const reportIds = reports.map((report) => report.id)
		expect(fetchedFDGLBans.length).toBe(reports.length)
		expect(fdglBanIds).toEqual(reportIds)
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
			createFDGLReport,
			[
				{
					categoryIds: oldFilterObject.categoryFilters,
					communityIds: oldFilterObject.communityFilters,
				},
			],
			5000
		)

		await database.getRepository(FDGLBan).save(reports, { chunk: 750 })

		const results = await filterObjectChangedBanlists({
			newFilter: newFilterObject,
			validReports: [],
			database,
		})

		const fetchedFDGLBans = await database.getRepository(FDGLBan).find()

		// the function should unban everyone there is a report against
		const allPlayers = [
			...new Set(reports.map((report) => report.playername)),
		]
		expect(results.toUnban.length).toBe(allPlayers.length)
		expect(results.toUnban).toEqual(allPlayers)

		// there should be no records of FDGL bans in the database, as they were all supposed to be removed
		expect(fetchedFDGLBans.length).toBe(0)
	})

	it("Should not re-ban players that are already banned", async () => {
		// this can occur if some filters are added to a config
		// the goal here is to check that the return of the value banlistResults.toBan totals to the amount of reports that have already
		// been handled (are created in the databse), so people that have already been banned should not be banned again
		const categories = createTimes(createFDGLCategory, 100)
		const categoryIds = categories.map((x) => x.id)
		const communities = createTimes(createFDGLCategory, 100)
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

		const playernames = createTimes(faker.internet.userName, 5500)
		const oldReports = createTimes(
			createFDGLReport,
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
			createFDGLReport,
			[
				{
					categoryIds: newFilterObject.categoryFilters,
					communityIds: newFilterObject.communityFilters,
					playernames: playernames,
				},
			],
			5000
		)

		await database.getRepository(FDGLBan).save(oldReports, { chunk: 750 })

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
			createFDGLReport,
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
			createFDGLReport,
			[
				{
					categoryIds: newFilterObject.categoryFilters,
					communityIds: newFilterObject.communityFilters,
					playernames: playernames,
				},
			],
			5000
		)

		await database.getRepository(FDGLBan).save(oldReports, { chunk: 750 })

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
			createFDGLReport,
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
			createFDGLReport,
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

		await database.getRepository(FDGLBan).save(oldReports, { chunk: 750 })
		await database.getRepository(Whitelist).save(whitelists, { chunk: 750 })
		await database
			.getRepository(PrivateBan)
			.save(privateBans, { chunk: 750 })

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
