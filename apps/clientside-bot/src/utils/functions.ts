import { Guild, TextChannel } from "discord.js"
import { GuildConfig, Report, Revocation } from "fagc-api-types"
import { Connection } from "typeorm"
import FAGCBot from "../base/FAGCBot"
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
 * Generate the list of players to ban and unban based on a guild config change
 */
export async function guildConfigChangedBanlists({
	newConfig,
	database,
	allGuildConfigs,
	validReports,
}: {
	/**
	 * The new guild config
	 */
	newConfig: GuildConfig
	/**
	 * Connection to the database
	 */
	database: Connection
	/**
	 * All guild configs that are currently loaded by the bot
	 */
	allGuildConfigs: GuildConfig[]
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
		})
	})

	// loop over the single map and check if the player is banned in the new config
	for (const [playername, bans] of bansByPlayer) {
		const newBans = bans.filter((ban) => {
			// check if the ban is valid under the new guild filters
			return (
				newConfig.trustedCommunities.includes(ban.communityId) &&
				newConfig.categoryFilters.includes(ban.categoryId)
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
		// compile a list of all filters
		const allFilteredCommunities = [
			...new Set(
				allGuildConfigs.map((config) => config.trustedCommunities)
			),
		]
		const allFilteredCategories = [
			...new Set(allGuildConfigs.map((config) => config.categoryFilters)),
		]

		// create a temp table to store the filters
		await transaction.query(
			"CREATE TEMP TABLE `temp.community_filters` (id INTEGER PRIMARY KEY AUTOINCREMENT, communityId TEXT, categoryId TEXT);"
		)
		await transaction.query(
			`INSERT INTO \`temp.community_filters\` (communityId) VALUES ('${allFilteredCommunities.join(
				"'), ('"
			)}');`
		)
		await transaction.query(
			`INSERT INTO \`temp.community_filters\` (categoryId) VALUES ('${allFilteredCategories.join(
				"'), ('"
			)}');`
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
	[ ] implement handling of reports
	[ ] implement handling of revocations
	[ ] implement handling of removal of categories + communities
*/

/**
 * Handle a report event from the FAGC API
 * @returns List of guild IDs in which the player should be banned or false if the report is invalid across all guilds
 */
export async function handleReport({
	report,
	database,
	allGuildConfigs,
}: {
	report: Report
	database: Connection
	allGuildConfigs: GuildConfig[]
}): Promise<false | string[]> {
	// check if the report is valid according to ANY of the guild configs
	const isValidReport = allGuildConfigs.reduce<[boolean, GuildConfig[]]>(
		(isValid, config) => {
			// check whether the report is valid under the current guild config
			if (
				config.categoryFilters.includes(report.categoryId) &&
				config.trustedCommunities.includes(report.communityId)
			) {
				// if the report is valid, add the guild ID to the list of guilds to ban
				isValid[0] = true
				isValid[1].push(config)
			}

			return isValid
		},
		[false, []]
	)

	// the report is not valid in ANY guild, so it makes no sense to do anything with it
	if (!isValidReport[0]) return false

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
	if (isWhitelisted) return []
	const isPrivatebanned = await database.getRepository(PrivateBan).findOne({
		playername: report.playername,
	})
	if (isPrivatebanned) return []

	const existing = await database.getRepository(FAGCBan).find({
		playername: report.playername,
	})

	// figure out in which guilds the report is valid, but the player is not banned by other reports
	const guildsToBan = isValidReport[1].filter((guild) => {
		const isBannedAlready = existing
			// ignore the report that is being handled
			.filter((ban) => ban.id !== report.id)
			.reduce<boolean>((isNotBanned, report) => {
				// if the report matches this guild's filters, then the player is banned already
				if (
					guild.trustedCommunities.includes(report.communityId) &&
					guild.categoryFilters.includes(report.categoryId)
				) {
					// the player is banned already
					return true
				} else {
					// the player may or may not have previous reports against them valid
					return isNotBanned
				}
				// the default value is true, as if there are no existing reports, the player is not banned yet
			}, false)

		// if the player is already banned in this guild, don't ban them again
		return !isBannedAlready
	})

	// return the guild IDs in which the player should be banned
	return guildsToBan.map((guild) => guild.guildId)
}

/**
 * Handle a revocation event from the FAGC API
 * @returns List of guild IDs in which the player should be unbanned or false if the revocation is invalid across all guilds
 */
export async function handleRevocation({
	revocation,
	database,
	allGuildConfigs,
}: {
	revocation: Revocation
	database: Connection
	allGuildConfigs: GuildConfig[]
}): Promise<false | string[]> {
	// check if the report is valid according to ANY of the guild configs
	const isValidRevocation = allGuildConfigs.reduce<[boolean, GuildConfig[]]>(
		(isValid, config) => {
			// check whether the report is valid under the current guild config
			if (
				config.categoryFilters.includes(revocation.categoryId) &&
				config.trustedCommunities.includes(revocation.communityId)
			) {
				// if the report is valid, add the guild ID to the list of guilds to ban
				isValid[0] = true
				isValid[1].push(config)
			}

			return isValid
		},
		[false, []]
	)

	if (!isValidRevocation[0]) return false

	// remove the report from the database no matter what
	await database.getRepository(FAGCBan).delete({
		id: revocation.id,
	})

	// if the player is whitelisted or private banned, do nothing
	const isWhitelisted = await database.getRepository(Whitelist).findOne({
		playername: revocation.playername,
	})
	if (isWhitelisted) return []
	const isPrivatebanned = await database.getRepository(PrivateBan).findOne({
		playername: revocation.playername,
	})
	if (isPrivatebanned) return []

	const existing = await database.getRepository(FAGCBan).find({
		playername: revocation.playername,
	})

	// figure out in which guilds the report is valid, but the player is not banned by other reports
	const guildsToUnban = isValidRevocation[1].filter((guild) => {
		// no filtering required here, as the report is already removed from the database
		const isStillBanned = existing.reduce<boolean>(
			(isNotBanned, report) => {
				// if the report matches this guild's filters, then the player is still banned so don't unban them
				if (
					guild.trustedCommunities.includes(report.communityId) &&
					guild.categoryFilters.includes(report.categoryId)
				) {
					// the player is still banned
					return true
				} else {
					// the player may or may not have previous reports against them valid
					return isNotBanned
				}
				// default to false, as if there are no existing reports, the player is not banned anymore
			},
			false
		)
		return !isStillBanned
	})

	// return the guild IDs in which the player should be unbanned
	return guildsToUnban.map((guild) => guild.guildId)
}
