import { Guild, TextChannel } from "discord.js"
import { GuildConfig, Report } from "fagc-api-types"
import { Connection } from "typeorm"
import FAGCBot from "../base/FAGCBot"
import FAGCBan from "../database/FAGCBan"
import PrivateBan from "../database/PrivateBan"

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
 * Generate the different
 */
export async function guildConfigChangedBanlists({
	oldConfig,
	newConfig,
	database,
	allGuildConfigs,
	validReports,
}: {
	oldConfig: GuildConfig
	newConfig: GuildConfig
	database: Connection
	allGuildConfigs: GuildConfig[]
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
