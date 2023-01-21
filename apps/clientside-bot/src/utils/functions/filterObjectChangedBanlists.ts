import { FilterObject, Report } from "@fdgl/types"
import { Connection } from "typeorm"
import FDGLBan from "../../database/FDGLBan"
import PrivateBan from "../../database/PrivateBan"
import Whitelist from "../../database/Whitelist"
import splitIntoGroups from "./splitIntoGroups"

/**
 * Generate the list of players to ban and unban based on a filter object change
 */
export default async function filterObjectChangedBanlists({
	newFilter,
	database,
	validReports,
}: {
	/**
	 * The new filter
	 */
	newFilter: FilterObject
	/**
	 * Connection to the database
	 */
	database: Connection
	/**
	 * New reports that are valid for the new config
	 */
	validReports: Report[]
}) {
	/*
	 	- Unbanning
			- Has no valid reports against them, only revocations
			- Is not privately banned
		- Banning
			- Has valid reports against them
			- Is not privately banned
		- Extra
			- Remove reports from the database that are no longer valid, such as categories or communities that have been removed from filters
			- Create reports in the database if they match rule and community filters, even if the player is privately banned
			- Keep in mind, that some people's reports *still may be valid* in other guilds, so we need to keep track of which guilds they are valid in and not remove them from the DB outright
	*/

	const toBanPlayers = new Set<string>()
	const toUnbanPlayers = new Set<string>()

	const currentBans = await database.getRepository(FDGLBan).find()
	const whitelist = await database.getRepository(Whitelist).find()
	const privateBans = await database.getRepository(PrivateBan).find()

	const currentlyBannedPlayers = new Set(
		currentBans.map((ban) => ban.playername)
	)

	// get all the reports into a single map
	const bansByPlayer = new Map<string, FDGLBan[]>()
	currentBans.forEach((ban) => {
		if (!bansByPlayer.has(ban.playername)) {
			bansByPlayer.set(ban.playername, [ban])
		} else {
			bansByPlayer.get(ban.playername)!.push(ban)
		}
	})
	validReports.forEach((report) => {
		if (!bansByPlayer.has(report.playername)) {
			bansByPlayer.set(report.playername, [])
		} else {
			bansByPlayer.get(report.playername)!.push({
				id: report.id,
				playername: report.playername,
				communityId: report.communityId,
				categoryId: report.categoryId,
				removedAt: null,
				createdAt: report.reportCreatedAt,
			})
		}
	})

	// loop over the single map and check if the player is banned in the new config
	for (const [playername, bans] of bansByPlayer) {
		const newBans = bans.filter((ban) => {
			// check if the ban is valid under the new guild filters
			return (
				newFilter.communityFilters.includes(ban.communityId) &&
				newFilter.categoryFilters.includes(ban.categoryId)
			)
		})

		if (newBans.length > 0) {
			// if the player is banned in the new config, add them to the list of players to ban
			if (!currentlyBannedPlayers.has(playername))
				toBanPlayers.add(playername)
		} else {
			// unban the player
			toUnbanPlayers.add(playername)
		}
	}

	// remove any old bans that are not in any config from the database
	// this is done in a transaction so that the table temp.community_filters is not actually created
	await database.transaction(async (transaction) => {
		// create a temp table to store the filters
		await transaction.query(
			"CREATE TEMP TABLE `temp.community_filters` (id INTEGER PRIMARY KEY AUTOINCREMENT, communityId TEXT, categoryId TEXT);"
		)
		await transaction.query(
			`INSERT INTO \`temp.community_filters\` (communityId) VALUES ('${newFilter.communityFilters}');`
		)
		await transaction.query(
			`INSERT INTO \`temp.community_filters\` (categoryId) VALUES ('${newFilter.categoryFilters}');`
		)

		// remove all the bans that are not in the filters
		await transaction
			.getRepository(FDGLBan)
			.createQueryBuilder()
			.delete()
			.where(
				"communityId NOT IN (SELECT communityId FROM `temp.community_filters` WHERE communityId IS NOT NULL)"
			)
			.orWhere(
				"categoryId NOT IN (SELECT categoryId FROM `temp.community_filters` WHERE categoryId IS NOT NULL)"
			)
			.execute()
		// drop the temp table since it's useless now
		await transaction.query("DROP TABLE `temp.community_filters`;")
	})

	// insert valid reports into the database AFTER the above transaction
	// since all these reports are valid, it doesn't make sense for the transaction to check them
	// and remove them from the database
	for (const splitReports of splitIntoGroups(validReports, 750)) {
		await database
			.getRepository(FDGLBan)
			.createQueryBuilder()
			.insert()
			.orIgnore()
			.values(
				splitReports.map((report) => {
					return {
						id: report.id,
						playername: report.playername,
						communityId: report.communityId,
						categoryId: report.categoryId,
					}
				})
			)
			.execute()
	}

	// remove any mention of players that are whitelisted or private banned from results of banning and unbanning
	for (const record of [...whitelist, ...privateBans]) {
		toBanPlayers.delete(record.playername)
		toUnbanPlayers.delete(record.playername)
	}

	return {
		/**
		 * The players that are to be banned
		 */
		toBan: [...toBanPlayers],
		/**
		 * The players that are to be unbanned
		 */
		toUnban: [...toUnbanPlayers],
	}
}
