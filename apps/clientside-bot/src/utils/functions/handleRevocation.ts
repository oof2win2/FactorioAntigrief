import { FilterObject, Revocation } from "fagc-api-types"
import { Connection } from "typeorm"
import FAGCBan from "../../database/FAGCBan"
import PrivateBan from "../../database/PrivateBan"
import Whitelist from "../../database/Whitelist"

/**
 * Handle a revocation event from the FAGC API
 * @returns List of guild IDs in which the player should be unbanned or false if the revocation is invalid across all guilds
 */
export default async function handleRevocation({
	revocation,
	database,
	filter,
	offlineServerCount,
}: {
	revocation: Revocation
	database: Connection
	filter: FilterObject
	offlineServerCount: number
}): Promise<boolean> {
	// if the revocation is not accepted by the config, ignore it
	if (
		!filter.categoryFilters.includes(revocation.categoryId) ||
		!filter.communityFilters.includes(revocation.communityId)
	)
		return false

	// remove the report from the database if the offline server count is 0, else just mark it as revoked
	if (offlineServerCount > 0) {
		await database.getRepository(FAGCBan).update(
			{
				id: revocation.id,
			},
			{
				removedAt: new Date(),
			}
		)
	} else {
		await database.getRepository(FAGCBan).delete({
			id: revocation.id,
		})
	}

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
