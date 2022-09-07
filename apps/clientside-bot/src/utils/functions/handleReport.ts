import { FilterObject, Report } from "fagc-api-types"
import { Connection } from "typeorm"
import FAGCBan from "../../database/FAGCBan"
import PrivateBan from "../../database/PrivateBan"
import Whitelist from "../../database/Whitelist"

/**
 * Handle a report event from the FAGC API
 * @returns List of guild IDs in which the player should be banned or false if the report is invalid across all guilds
 */
export default async function handleReport({
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
