import { Guild, TextChannel } from "discord.js"
import { FilterObject, GuildConfig, Report, Revocation } from "fagc-api-types"
import { Connection } from "typeorm"
import FAGCBan from "../database/FAGCBan"
import PrivateBan from "../database/PrivateBan"
import Whitelist from "../database/Whitelist"
import ServerOnline from "../database/ServerOnline"

export type ArgumentTypes<F> = F extends (...args: infer A) => any ? A : never

export async function sendGuildMessage(
	guild: Guild,
	message: ArgumentTypes<TextChannel["send"]>[0]
) {
	const owner = () => {
		guild
			.fetchOwner()
			.then((owner) => owner.send(message))
			.catch(() => {
				console.log(
					`Could not send message to guild ${guild.name} (${guild.id})`
				)
			})
	}

	const systemChannel = () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		guild.systemChannel!.send(message).catch(() => owner())
	}

	const publicUpdatesChannel = () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		guild.publicUpdatesChannel!.send(message).catch(() => systemChannel())
	}
	if (guild.publicUpdatesChannel) {
		publicUpdatesChannel()
	} else if (guild.systemChannel) {
		systemChannel()
	} else {
		owner()
	}
}

/**
 * Split a single large array into multiple smaller ones
 * @param items A single array of items to split into smalleer groups of the specified size
 * @param maxCount Maximum items in a group
 * @returns An array of arrays of items, with the maximum number of items per group being the specified size
 */
export function splitIntoGroups<T>(items: T[], maxCount = 500): T[][] {
	return items.reduce<T[][]>(
		(previous, item) => {
			const last = previous[previous.length - 1]
			if (last.length >= maxCount) {
				// if the last group is full, start a new one
				previous.push([item])
			} else {
				// otherwise, add the item to the last group
				last.push(item)
			}
			return previous
		},
		[[]]
	)
}

/**
 * Function to check if a date is between two other dates
 * @param date The date to check
 * @param start The start date
 * @param end The end date
 */
export const dateIsBetween = (date: Date, start: Date, end: Date): boolean => {
	return date >= start && date <= end
}

/**
 * Generate the list of players to ban and unban based on a filter object change
 */
export async function filterObjectChangedBanlists({
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

	const currentBans = await database.getRepository(FAGCBan).find()
	const whitelist = await database.getRepository(Whitelist).find()
	const privateBans = await database.getRepository(PrivateBan).find()

	const currentlyBannedPlayers = new Set(
		currentBans.map((ban) => ban.playername)
	)

	// get all the reports into a single map
	const bansByPlayer = new Map<string, FAGCBan[]>()
	currentBans.forEach((ban) => {
		if (!bansByPlayer.has(ban.playername)) {
			bansByPlayer.set(ban.playername, [])
		}
		bansByPlayer.get(ban.playername)!.push(ban)
	})
	validReports.forEach((report) => {
		if (!bansByPlayer.has(report.playername)) {
			bansByPlayer.set(report.playername, [])
		}
		bansByPlayer.get(report.playername)!.push({
			id: report.id,
			playername: report.playername,
			communityId: report.communityId,
			categoryId: report.categoryId,
			removedAt: null,
			createdAt: report.reportCreatedAt,
		})
	})

	// const filter = allFilters.find(
	// 	(filter) => filter.id === newConfig.filterObjectId
	// )!

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
			.getRepository(FAGCBan)
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
	for (const splitReports of splitIntoGroups(validReports, 5000)) {
		await database
			.getRepository(FAGCBan)
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

/*
	[ ] implement handling of removal of categories + communities
*/

/**
 * Handle a report event from the FAGC API
 * @returns List of guild IDs in which the player should be banned or false if the report is invalid across all guilds
 */
export async function handleReport({
	report,
	database,
	filter,
}: {
	report: Report
	database: Connection
	filter: FilterObject
}): Promise<boolean> {
	// check if the report is valid in the guild first, if it isn't, skip it
	if (
		!filter.categoryFilters.includes(report.categoryId) ||
		!filter.communityFilters.includes(report.communityId)
	)
		return false

	// insert the report to the database no matter what
	await database.getRepository(FAGCBan).insert({
		id: report.id,
		playername: report.playername,
		communityId: report.communityId,
		categoryId: report.categoryId,
	})

	// if the player is whitelisted or private banned, do nothing
	const isWhitelisted = await database.getRepository(Whitelist).findOne({
		playername: report.playername,
	})
	if (isWhitelisted) return false
	const isPrivatebanned = await database.getRepository(PrivateBan).findOne({
		playername: report.playername,
	})
	if (isPrivatebanned) return false

	const existing = await database.getRepository(FAGCBan).find({
		playername: report.playername,
	})

	// figure out whether the player should be banned or not
	// this depends on whether they are banned already for another report or no
	const isAlreadyBanned = existing
		.filter((ban) => ban.id !== report.id)
		.some((report) => {
			return (
				report.communityId === report.communityId &&
				report.categoryId === report.categoryId
			)
		})

	// if the player is already banned, don't ban them again, if they are not banned then ban them
	return !isAlreadyBanned
}

/**
 * Handle a revocation event from the FAGC API
 * @returns List of guild IDs in which the player should be unbanned or false if the revocation is invalid across all guilds
 */
export async function handleRevocation({
	revocation,
	database,
	filter,
}: {
	revocation: Revocation
	database: Connection
	filter: FilterObject
}): Promise<boolean> {
	// if the revocation is not accepted by the config, ignore it
	if (
		!filter.categoryFilters.includes(revocation.categoryId) ||
		!filter.communityFilters.includes(revocation.communityId)
	)
		return false

	// remove the report from the database no matter what
	await database.getRepository(FAGCBan).delete({
		id: revocation.id,
	})

	// if the player is whitelisted or private banned, do nothing
	const isWhitelisted = await database.getRepository(Whitelist).findOne({
		playername: revocation.playername,
	})
	if (isWhitelisted) return false
	const isPrivatebanned = await database.getRepository(PrivateBan).findOne({
		playername: revocation.playername,
	})
	if (isPrivatebanned) return false

	const existing = await database.getRepository(FAGCBan).find({
		playername: revocation.playername,
	})

	// figure out whether the player should be unbanned or not depending on whether any other FAGC bans are valid
	const otherValidBans = existing.some((report) => {
		return (
			report.communityId === report.communityId &&
			report.categoryId === report.categoryId
		)
	})

	// unban the player if other bans are not valid, keep them banned if they are valid
	return !otherValidBans
}

export async function handleConnected({
	reports,
	revocations,
	database,
}: {
	/**
	 * List of filtered reports that are accepted by guild configs
	 */
	reports: Report[]
	/**
	 * List of filtered revocations that are accepted by guild configs
	 */
	revocations: Revocation[]
	/**
	 * Database
	 */
	database: Connection
}) {
	const toBanPlayers = new Set<string>()
	const toUnbanPlayers = new Set<string>()

	const currentBans = await database.getRepository(FAGCBan).find()
	const whitelist = await database.getRepository(Whitelist).find()
	const privateBans = await database.getRepository(PrivateBan).find()

	const currentlyBannedPlayers = new Set(
		currentBans.map((ban) => ban.playername)
	)

	// get all the reports into a single map
	const bansByPlayer = new Map<string, FAGCBan[]>()
	currentBans.forEach((ban) => {
		if (!bansByPlayer.has(ban.playername)) {
			bansByPlayer.set(ban.playername, [])
		}
		bansByPlayer.get(ban.playername)!.push(ban)
	})

	// put current reports into the array of reports by player
	reports.forEach((report) => {
		if (!bansByPlayer.has(report.playername)) {
			bansByPlayer.set(report.playername, [])
		}
		bansByPlayer.get(report.playername)!.push({
			id: report.id,
			playername: report.playername,
			communityId: report.communityId,
			categoryId: report.categoryId,
			removedAt: null,
			createdAt: report.reportCreatedAt,
		})

		// if the player is not banned yet (new report), we ban them now
		if (!currentlyBannedPlayers.has(report.playername))
			toBanPlayers.add(report.playername)
	})

	// if a report was revoked, then we need to ensure that the players should
	revocations.forEach((revocation) => {
		// this should never happen, but just in case
		if (!bansByPlayer.has(revocation.playername)) return

		const currentBans = bansByPlayer.get(revocation.playername)!
		const nonrevokedBans = currentBans.filter(
			(report) => report.id !== revocation.id
		)
		bansByPlayer.set(revocation.playername, nonrevokedBans)

		// if the player is already banned and has no more bans, we unban the player
		if (nonrevokedBans.length === 0) {
			// if the player is banned, we unban them
			if (currentlyBannedPlayers.has(revocation.playername))
				toUnbanPlayers.add(revocation.playername)
			currentlyBannedPlayers.delete(revocation.playername)
			// remove the player from the list of players to ban if they were ever there
			toBanPlayers.delete(revocation.playername)
		}
	})

	// remove reports that were revoked from the database
	// this is done in a transaction to allow it to have more variables
	await database.transaction(async (transaction) => {
		// create a temp table to store the IDs
		await transaction.query(
			"CREATE TEMP TABLE `temp.revocations` (id TEXT PRIMARY KEY);"
		)
		await transaction.query(
			`INSERT INTO \`temp.revocations\` (id) VALUES ('${revocations
				.map((revocation) => revocation.id)
				.join("'), ('")}');`
		)

		// remove all the bans that are not in the filters
		await transaction
			.getRepository(FAGCBan)
			.createQueryBuilder()
			.delete()
			.where(
				"id IN (SELECT id FROM `temp.revocations` WHERE id IS NOT NULL)"
			)
			.execute()
		// drop the temp table since it's useless now
		await transaction.query("DROP TABLE `temp.revocations`;")
	})

	// get a list of reports that were not revoked to insert into the database
	const revokedReportIDs = new Set(
		revocations.map((revocation) => revocation.id)
	)
	const unrevokedReports = reports.filter(
		(report) => !revokedReportIDs.has(report.id)
	)
	// add the new reports into the database
	// we do this after removing any reports that were revoked, so that
	for (const splitReports of splitIntoGroups(unrevokedReports, 5000)) {
		await database
			.getRepository(FAGCBan)
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

	// exclude players that are whitelisted or blacklisted from any actions
	whitelist.forEach(({ playername }) => {
		toBanPlayers.delete(playername)
		toUnbanPlayers.delete(playername)
	})
	privateBans.forEach(({ playername }) => {
		toBanPlayers.delete(playername)
		toUnbanPlayers.delete(playername)
	})

	return {
		/**
		 * List of players to ban
		 */
		toBan: [...toBanPlayers],
		/**
		 * List of players to unban
		 */
		toUnban: [...toUnbanPlayers],
	}
}

/**
 * Function to check if a player has valid FAGC reports against them and whether they should be banned for them
 * @returns False if the player should not be banned, a FAGCBan if the player should be banned
 */
export async function hasFAGCBans({
	playername,
	filter,
	database,
}: {
	playername: string
	filter: FilterObject
	database: Connection
}): Promise<false | FAGCBan> {
	const bans = await database.getRepository(FAGCBan).find({
		playername: playername,
	})
	if (bans.length === 0) return false

	// find the first ban that matches the filters and return it
	for (const ban of bans) {
		if (!filter.categoryFilters.includes(ban.categoryId)) continue
		if (!filter.communityFilters.includes(ban.communityId)) continue
		return ban
	}

	// if no ban that matches the filters is found, then the player should not be banned
	return false
}

export async function handleMissedData({
	server,
	allServers,
	filters,
	database,
}: {
	server: ServerOnline
	allServers: ServerOnline[]
	filters: FilterObject
	database: Connection
}) {
	/*
	 The basic methodology here is to group everything by playername first.
	 T1 is the time that the server went offline, T2 is the time that the server went back online.
	 Then we check if a player has any privatebans against them at T1 and T2. If they do, we ban for the one at T2 (if they are the same, do nothing)
	 If they don't, we check if they have a whitelist at T2. If they do, we unban them (faster than checking if they were banned at T1).
	 If they don't, we check if they have valid reports at T1 and T2. If they are the same, do nothing. If they are different, we ban them for
	 the one at T2. If they don't have any reports at T2 but do at T1, we unban them. Do nothing if no reports at either.
	*/
	const allReports = await database.getRepository(FAGCBan).find()
	const privatebans = await database.getRepository(PrivateBan).find()
	const whitelist = await database.getRepository(Whitelist).find()

	// first, group them all by playername
	const reportsByPlayer = new Map<string, FAGCBan[]>()
	const privatebansByPlayer = new Map<string, PrivateBan[]>()
	const whitelistByPlayer = new Map<string, Whitelist[]>()
	const allPlayernames = new Set<string>()

	for (const report of allReports) {
		if (!reportsByPlayer.has(report.playername))
			reportsByPlayer.set(report.playername, [])
		reportsByPlayer.get(report.playername)!.push(report)
		allPlayernames.add(report.playername)
	}
	for (const privateban of privatebans) {
		if (!privatebansByPlayer.has(privateban.playername))
			privatebansByPlayer.set(privateban.playername, [])
		privatebansByPlayer.get(privateban.playername)!.push(privateban)
		allPlayernames.add(privateban.playername)
	}
	for (const whitelistEntry of whitelist) {
		if (!whitelistByPlayer.has(whitelistEntry.playername))
			whitelistByPlayer.set(whitelistEntry.playername, [])
		whitelistByPlayer.get(whitelistEntry.playername)!.push(whitelistEntry)
		allPlayernames.add(whitelistEntry.playername)
	}

	const privatebansToBan: (PrivateBan & { reban: boolean })[] = []
	const reportsToBan: (FAGCBan & { reban: boolean })[] = []
	const playersToUnban: string[] = []

	for (const playername of allPlayernames) {
		let shouldBeUnbanned = false

		const privatebans = privatebansByPlayer.get(playername)
		if (privatebans) {
			// check for the existence of privatebans at T1 and T2
			let privatebanAtT1: PrivateBan | null = null
			let privatebanAtT2: PrivateBan | null = null
			for (const privateban of privatebans) {
				// check the T1 date, which is when the server went offline
				if (
					!privatebanAtT1 &&
					dateIsBetween(
						server.offlineSince,
						privateban.createdAt,
						privateban.removedAt || new Date()
					)
				)
					privatebanAtT1 = privateban

				// check the T2 date, which is the current time
				if (
					!privatebanAtT2 &&
					dateIsBetween(
						new Date(),
						privateban.createdAt,
						privateban.removedAt || new Date()
					)
				)
					privatebanAtT2 = privateban
			}
			if (privatebanAtT1 == privatebanAtT2) {
				// if they are the same, the player stays banned for the same reason and we don't need to do anything
				continue
			} else if (privatebanAtT2) {
				privatebansToBan.push({
					...privatebanAtT2,
					reban: true,
				})
			} else if (privatebanAtT1 && !privatebanAtT2) {
				// there was a privateban at T1, but not at T2, so we should unban them (for now)
				shouldBeUnbanned = true
			}
		}

		const whitelists = whitelistByPlayer.get(playername)
		if (whitelists) {
			// check for the existence of whitelists at T2
			const whitelistAtT2 = whitelists.find((whitelist) =>
				dateIsBetween(
					new Date(),
					whitelist.createdAt,
					whitelist.removedAt || new Date()
				)
			)
			if (whitelistAtT2) {
				// if there is a whitelist at T2, we unban them
				// we don't care about anything else, as they are whitelisted so any reports against them should be ignored
				playersToUnban.push(playername)
				continue
			}
		}

		const reports = reportsByPlayer.get(playername)
		if (reports) {
			// filter reports only here, as it would be wasteful to filter reports against a player if they are whitelisted
			const filteredReports = reports.filter((report) => {
				if (
					filters.categoryFilters.includes(report.categoryId) &&
					filters.communityFilters.includes(report.communityId)
				)
					return true
				return false
			})
			// check for the existence of reports at T1 and T2
			let reportAtT1: FAGCBan | null = null
			let reportAtT2: FAGCBan | null = null
			for (const report of filteredReports) {
				// check the T1 date, which is when the server went offline
				if (
					!reportAtT1 &&
					dateIsBetween(
						server.offlineSince,
						report.createdAt,
						report.removedAt || new Date()
					)
				)
					reportAtT1 = report

				// check the T2 date, which is the current time
				if (
					!reportAtT2 &&
					dateIsBetween(
						new Date(),
						report.createdAt,
						report.removedAt || new Date()
					)
				)
					reportAtT2 = report
			}
			if (reportAtT1 == reportAtT2) {
				// if they are the same, the player stays banned for the same reason and we don't need to do anything
				continue
			} else if (reportAtT1 && reportAtT2) {
				// if there are reports at both T1 and T2 but aren't identical, we should reban them for T2
				reportsToBan.push({
					...reportAtT2,
					reban: true,
				})
			} else if (reportAtT2 && !reportAtT1) {
				// there is a valid report now but wasn't before, so we should ban them for the one at T2
				reportsToBan.push({
					...reportAtT2,
					reban: false,
				})
			} else if (reportAtT1 && !reportAtT2) {
				// there was a report at T1, but not at T2, so we should unban them (for now)
				shouldBeUnbanned = true
			}
			/*
				Other things that could happen are:
				- There are no valid reports at T1 and T2 (don't match filters) so we ignore them
			*/
		}

		if (shouldBeUnbanned) {
			playersToUnban.push(playername)
		}
	}

	// we now have all of the player lists assembled, but now we need to purge the database of data that is no longer relevant
	// i.e. should have been deleted and this was the last server that was supposed to use it
	const sortedOfflineDates = allServers
		.map((server) => {
			if (server.isOnline) return false
			return server.offlineSince
		})
		.filter((date): date is Date => date !== false)
		.sort()
	// the last offline date is the date that we clear until, or the current date if all servers are online
	const lastOfflineDate =
		sortedOfflineDates[sortedOfflineDates.length - 1] || new Date()
	await database
		.getRepository(FAGCBan)
		.createQueryBuilder()
		.delete()
		.where(`removedAt < :date`, { date: lastOfflineDate })
		.execute()
	await database
		.getRepository(Whitelist)
		.createQueryBuilder()
		.delete()
		.where(`removedAt < :date`, { date: lastOfflineDate })
		.execute()
	await database
		.getRepository(PrivateBan)
		.createQueryBuilder()
		.delete()
		.where(`removedAt < :date`, { date: lastOfflineDate })
		.execute()

	return {
		privatebansToBan,
		reportsToBan,
		playersToUnban,
	}
}
