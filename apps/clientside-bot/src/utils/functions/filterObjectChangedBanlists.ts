import { FilterObject, Report } from "@fdgl/types"
import PrivateBan from "../../database/PrivateBan"
import Whitelist from "../../database/Whitelist"
import { FDGLCategoryAction, FDGLCategoryHandler } from "../../types"

/**
 * Generate the list of players to ban and unban based on a filter object change
 *
 * Pure function
 */
export default async function filterObjectChangedBanlists({
	oldFilter,
	newFilter,
	previouslyValidReports,
	newlyValidReports,
	categoryActions,
	whitelist,
	privateBans,
}: {
	oldFilter: FilterObject
	newFilter: FilterObject
	previouslyValidReports: Report[]
	newlyValidReports: Report[]
	categoryActions: Map<string, FDGLCategoryHandler>
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

	const toBanPlayers: Report[] = []
	const toUnbanPlayers: Report[] = []
	const toRebanPlayers: Report[] = []
	const ignoredNames = [
		...whitelist.map((record) => record.playername),
		...privateBans.map((record) => record.playername),
	]

	// get all the reports into a single map
	const bansByPlayer = new Map<string, Report[]>()
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
		// if the player has a privateban or whitelist against them, we don't
		// want to take any action on them
		if (ignoredNames.includes(playername)) continue

		const newBans = bans.filter((ban) => {
			// check if the ban is valid under the new guild filters
			return (
				newFilter.communityFilters.includes(ban.communityId) &&
				newFilter.categoryFilters.includes(ban.categoryId)
			)
		})
		const oldBans = bans.filter((ban) => {
			// check if the ban is valid under the old guild filters
			return (
				oldFilter.communityFilters.includes(ban.communityId) &&
				oldFilter.categoryFilters.includes(ban.categoryId)
			)
		})

		// TODO: here we would compute the set difference of the actions taken
		const bannedBefore = oldBans.find((ban) => {
			const action = categoryActions.get(ban.categoryId)!
			if (action.createAction.includes(FDGLCategoryAction.FactorioBan))
				return true
		})
		const bannedAfter = newBans.find((ban) => {
			const action = categoryActions.get(ban.categoryId)!
			if (action.createAction.includes(FDGLCategoryAction.FactorioBan))
				return true
		})

		if (bannedBefore && !bannedAfter) {
			toUnbanPlayers.push(bannedBefore)
		} else if (bannedBefore && bannedAfter) {
			toRebanPlayers.push(bannedAfter)
		} else if (!bannedBefore && bannedAfter) {
			toBanPlayers.push(bannedAfter)
		}
	}

	// remove any old bans that are not in any config from the database
	const reportsToRemoveFromDB = previouslyValidReports.filter((ban) => {
		return (
			!newFilter.communityFilters.includes(ban.communityId) ||
			!newFilter.categoryFilters.includes(ban.categoryId)
		)
	})

	return {
		/**
		 * The players that are to be banned
		 */
		toBan: [...toBanPlayers],
		/**
		 * The players that are to be unbanned
		 */
		toUnban: [...toUnbanPlayers],
		toReban: [...toRebanPlayers],
		reportsToRemoveFromDB: reportsToRemoveFromDB,
	}
}
