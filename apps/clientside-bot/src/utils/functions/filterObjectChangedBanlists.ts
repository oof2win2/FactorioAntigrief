import { FilterObject } from "@fdgl/types"
import PrivateBan from "../../database/PrivateBan"
import Whitelist from "../../database/Whitelist"
import FDGLBan from "../../database/FDGLBan"

type ReportType = Omit<FDGLBan, "createdAt" | "removedAt">

/**
 * Generate the list of players to ban and unban based on a filter object change
 */
export default async function filterObjectChangedBanlists({
	oldFilter,
	newFilter,
	previouslyValidReports,
	newlyValidReports,
	whitelist,
	privateBans,
}: {
	oldFilter: FilterObject
	newFilter: FilterObject
	previouslyValidReports: ReportType[]
	newlyValidReports: ReportType[]
	whitelist: Whitelist[]
	privateBans: PrivateBan[]
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

	const toBanPlayers: ReportType[] = []
	const toUnbanPlayers: ReportType[] = []
	// list of IDs of reports to remove from the database
	const reportsToRemoveFromDB: string[] = []
	const ignoredNames = [
		...whitelist.map((record) => record.playername),
		...privateBans.map((record) => record.playername),
	]

	// get all the reports into a single map
	const bansByPlayer = new Map<string, ReportType[]>()
	previouslyValidReports.forEach((ban) => {
		if (!bansByPlayer.has(ban.playername)) {
			bansByPlayer.set(ban.playername, [ban])
		} else {
			bansByPlayer.get(ban.playername)!.push(ban)
		}
	})
	newlyValidReports.forEach((report) => {
		if (!bansByPlayer.has(report.playername)) {
			bansByPlayer.set(report.playername, [report])
		} else {
			bansByPlayer.get(report.playername)!.push(report)
		}
	})

	// loop over the single map and check if the player is banned in the new config
	for (const [playername, bans] of bansByPlayer) {
		// if the player is whitelisted or privately banned, ignore them
		if (ignoredNames.includes(playername)) continue

		// we now find the bans that were before and the bans that are now
		const oldBans = bans.filter((ban) => {
			if (!oldFilter.categoryFilters.includes(ban.categoryId))
				return false
			if (!oldFilter.communityFilters.includes(ban.communityId))
				return false
			return true
		})
		const newBans = bans.filter((ban) => {
			if (!newFilter.categoryFilters.includes(ban.categoryId)) {
				reportsToRemoveFromDB.push(ban.id)
				return false
			}
			if (!newFilter.communityFilters.includes(ban.communityId)) {
				reportsToRemoveFromDB.push(ban.id)
				return false
			}
			return true
		})

		const bannedBefore = oldBans.length > 0
		const bannedAfter = newBans.length > 0

		if (bannedBefore && !bannedAfter) {
			// the player was banned before, but is not banned now0
			toUnbanPlayers.push(oldBans[0])
		} else if (!bannedBefore && bannedAfter) {
			// the player was not banned before, but is banned now
			toBanPlayers.push(newBans[0])
		}
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
		reportsToRemoveFromDB,
	}
}
