import filterObjectChangedBanlists from "../../src/utils/functions/filterObjectChangedBanlists"
import {
	createFDGLCategory,
	createFDGLCommunity,
	createFDGLReport,
	createGuildConfig,
	createPrivateban,
	createTimes,
	createWhitelist,
	randomElementsFromArray,
} from "../utils"
import { Category, Community, Report } from "@fdgl/types"
import faker from "faker"
import { expect } from "chai"

describe("guildConfigChangedBanlists", () => {
	let categories: Category[]
	let categoryIds: string[]
	let communities: Community[]
	let communityIds: string[]
	beforeEach(async () => {
		categories = createTimes(createFDGLCategory, 100)
		categoryIds = categories.map((x) => x.id)
		communities = createTimes(createFDGLCommunity, 100)
		communityIds = communities.map((x) => x.id)
	})

	it("Should create bans for reports that have been newly included in the filters", async () => {
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
			oldFilter: oldFilterObject,
			newFilter: newFilterObject,
			previouslyValidReports: [],
			newlyValidReports: reports,
			whitelist: [],
			privateBans: [],
		})

		const allReportPlayernames = [
			...new Set(reports.map((report) => report.playername)),
		]
		// the function should ban everyone there is a report against
		expect(results.toBan.length).to.equal(allReportPlayernames.length)
		expect(results.toBan.map((x) => x.playername)).to.have.members(
			allReportPlayernames
		)

		// the function should not unban anyone
		expect(results.toUnban.length).to.equal(0)
		// the function should not remove anything from db
		expect(results.reportsToRemoveFromDB.length).to.equal(0)
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

		const results = await filterObjectChangedBanlists({
			oldFilter: oldFilterObject,
			newFilter: newFilterObject,
			previouslyValidReports: reports,
			newlyValidReports: [],
			whitelist: [],
			privateBans: [],
		})

		// the function should unban everyone there is a report against
		const allPlayerNames = [
			...new Set(reports.map((report) => report.playername)),
		]
		expect(results.toUnban.length).to.equal(allPlayerNames.length)
		expect(results.toUnban.map((x) => x.playername)).to.have.members(
			allPlayerNames
		)

		// it should not ban anyone
		expect(results.toBan.length).to.equal(0)
		// it should remove all records from the db
		expect(results.reportsToRemoveFromDB.length).to.equal(reports.length)
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
					// we ensure that the new reports do not ban for the old filters, so they aren't valid under the old config
					categoryIds: newFilterObject.categoryFilters.filter(
						(id) => !oldFilterObject.categoryFilters.includes(id)
					),
					communityIds: newFilterObject.communityFilters.filter(
						(id) => !oldFilterObject.communityFilters.includes(id)
					),
					playernames: playernames,
				},
			],
			10
		)

		const expectedBans = new Set<string>()
		// compile a list of people that should be banned with the new reports
		// excludes the people that have been banned with the old reports
		newReports.forEach((report) => expectedBans.add(report.playername))
		oldReports.forEach((report) => expectedBans.delete(report.playername))

		const results = await filterObjectChangedBanlists({
			oldFilter: oldFilterObject,
			newFilter: newFilterObject,
			previouslyValidReports: oldReports,
			newlyValidReports: [...newReports, ...oldReports],
			whitelist: [],
			privateBans: [],
		})

		// the function shouldn't re-ban people that are already banned
		expect(results.toBan.length).to.equal(expectedBans.size)
		expect(results.toBan.map((x) => x.playername)).to.have.members([
			...expectedBans,
		])

		// the function should not unban anyone
		expect(results.toUnban.length).to.equal(0)
		// the function should not remove anything from db
		expect(results.reportsToRemoveFromDB.length).to.equal(0)
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
					// we ensure that the new reports do not ban for the old filters, so they aren't valid under the old config
					categoryIds: newFilterObject.categoryFilters.filter(
						(id) => !oldFilterObject.categoryFilters.includes(id)
					),
					communityIds: newFilterObject.communityFilters.filter(
						(id) => !oldFilterObject.communityFilters.includes(id)
					),
					playernames: playernames,
				},
			],
			5000
		)

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
			oldFilter: oldFilterObject,
			newFilter: newFilterObject,
			previouslyValidReports: oldReports,
			newlyValidReports: [...validOldReports, ...newReports],
			whitelist: [],
			privateBans: [],
		})

		// the unbanned players should be the same
		expect(results.toUnban.length).to.equal(playersToUnban.size) // april, wendel, elda, vivien
		expect(results.toUnban.map((x) => x.playername)).to.have.members([
			...playersToUnban,
		])

		// the banned players should be the same
		expect(results.toBan.length).to.equal(playersToBan.size)
		expect(results.toBan.map((x) => x.playername)).to.have.members([
			...playersToBan,
		])

		// the function should remove invalid reports from the db
		const invalidReportIds = invalidOldReports.map((report) => report.id)
		expect(results.reportsToRemoveFromDB.length).to.equal(
			invalidReportIds.length
		)
		expect(results.reportsToRemoveFromDB).to.have.members(invalidReportIds)
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
					// we ensure that the new reports do not ban for the old filters, so they aren't valid under the old config
					categoryIds: newFilterObject.categoryFilters.filter(
						(id) => !oldFilterObject.categoryFilters.includes(id)
					),
					communityIds: newFilterObject.communityFilters.filter(
						(id) => !oldFilterObject.communityFilters.includes(id)
					),
					playernames: playernames,
				},
			],
			5000
		)

		const whitelists = createTimes(
			createWhitelist,
			[
				{
					playernames: playernames,
				},
			],
			5000
		)
		const privateBans = createTimes(
			createPrivateban,
			[
				{
					playernames: playernames,
				},
			],
			5000
		)

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
			oldFilter: oldFilterObject,
			newFilter: newFilterObject,
			previouslyValidReports: oldReports,
			newlyValidReports: [...validOldReports, ...newReports],
			whitelist: whitelists,
			privateBans: privateBans,
		})

		// the unbanned players should be the same
		expect(results.toUnban.length).to.equal(playersToUnban.size) // april, wendel, elda, vivien
		expect(results.toUnban.map((x) => x.playername)).to.have.members([
			...playersToUnban,
		])

		// the banned players should be the same
		expect(results.toBan.length).to.equal(playersToBan.size)
		expect(results.toBan.map((x) => x.playername)).to.have.members([
			...playersToBan,
		])
	})
})
