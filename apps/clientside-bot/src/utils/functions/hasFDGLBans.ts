import { FilterObject } from "@fdgl/types"
import { Connection } from "typeorm"
import FDGLBan from "../../database/FDGLBan"

/**
 * Function to check if a player has valid FDGL reports against them and whether they should be banned for them
 * @returns False if the player should not be banned, a FDGLBan if the player should be banned
 */
export default async function hasFDGLBans({
	playername,
	filter,
	database,
}: {
	playername: string
	filter: FilterObject
	database: Connection
}): Promise<false | FDGLBan> {
	const bans = await database.getRepository(FDGLBan).find({
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
