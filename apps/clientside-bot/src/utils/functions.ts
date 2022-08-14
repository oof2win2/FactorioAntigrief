import { Guild, TextChannel } from "discord.js"
import { FilterObject, GuildConfig, Report, Revocation } from "fagc-api-types"
import { Connection } from "typeorm"
import FAGCBan from "../database/FAGCBan"
import PrivateBan from "../database/PrivateBan"
import Whitelist from "../database/Whitelist"

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
