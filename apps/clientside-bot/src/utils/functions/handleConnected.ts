import { Report, Revocation } from "fagc-api-types"
import { Connection } from "typeorm"
import FAGCBan from "../../database/FAGCBan"
import PrivateBan from "../../database/PrivateBan"
import Whitelist from "../../database/Whitelist"
import splitIntoGroups from "./splitIntoGroups"

export default async function handleConnected({
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
