import { Guild, TextChannel } from "discord.js"
import { GuildConfig, Report, Revocation } from "fagc-api-types"
import { In, Not } from "typeorm"
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
	client,
	filteredReports,
}: {
	oldConfig: GuildConfig
	newConfig: GuildConfig
	client: FAGCBot
	filteredReports: Report[]
}) {
	/*
		TODO
	 	- Unbanning
			- Has no valid reports against them, only revocations
			- Is not privately banned
		- Banning
			- Has valid reports against them
			- Is not privately banned
		- Extra
			- Remove reports from the database that are no longer valid, such as rules or communities that have been removed
			- Create reports in the database if they match rule and community filters, even if the player is privately banned
			- Keep in mind, that some people's reports *still may be valid* in other guilds, so we need to keep track of which guilds they are valid in and not remove them from the DB outright
	*/

	// UNBANNING
	const toUnbanPlayers = new Set<string>()

	// FAGC reports acknowledged by the old config
	const oldBans = await (await client.db).getRepository(FAGCBan).find({
		communityId: In(oldConfig.trustedCommunities),
		categoryId: In(oldConfig.categoryFilters),
	})

	// get the reports by playername
	const reportsByPlayer: Map<string, FAGCBan[]> = new Map()
	oldBans.forEach((ban) => {
		const existing = reportsByPlayer.get(ban.playername)
		if (!existing) {
			// if the player is not yet in the reportsByPlayer map, add them
			reportsByPlayer.set(ban.playername, [ban])
		} else {
			// add the player to the existing array and set it back
			existing.push(ban)
			reportsByPlayer.set(ban.playername, existing)
		}
	})

	// go through each player and remove their bans that are no longer accepted
	reportsByPlayer.forEach((bans, playername) => {
		const newBans = bans.filter((ban) => {
			// if the ban is still accepted by the new config, keep it
			return (
				newConfig.trustedCommunities.includes(ban.communityId) &&
				newConfig.categoryFilters.includes(ban.categoryId)
			)
		})
		// if there are no new bans, we can unban the player
		if (newBans.length === 0) {
			toUnbanPlayers.add(playername)
		}
		// set the bans by id to the new array
		reportsByPlayer.set(playername, newBans)
	})

	// BANNING
	// go through the new reports that match filters and ban the players for them
	const toBanPlayers = new Set<string>()
	filteredReports.forEach((report) => {
		// if the player is to be unbanned, they will stay banned now
		toUnbanPlayers.delete(report.playername)

		// if the player is not already banned, ban them
		toBanPlayers.add(report.playername)
	})

	// remove bans from the database that are no longer accepted by ANY guild
	const allFilteredCategoryIds = new Set(
		client.guildConfigs.map((config) => config.categoryFilters)
	)
	const allFilteredCommunityIds = new Set(
		client.guildConfigs.map((config) => config.trustedCommunities)
	)
	await (
		await client.db
	)
		.getRepository(FAGCBan)
		.createQueryBuilder()
		.delete()
		.where({
			categoryId: Not(In([...allFilteredCategoryIds])),
		})
		.orWhere({
			communityId: Not(In([...allFilteredCommunityIds])),
		})
		.execute()

	// create the new reports in the database
	await (await client.db).getRepository(FAGCBan).insert(
		filteredReports.map((report) => {
			return {
				id: report.id,
				playername: report.playername,
				communityId: report.communityId,
				categoryId: report.categoryId,
			}
		})
	)

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
