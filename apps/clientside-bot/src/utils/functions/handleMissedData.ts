import { FilterObject } from "fagc-api-types"
import { Connection } from "typeorm"
import { DateUtils } from "typeorm/util/DateUtils"
import FAGCBan from "../../database/FAGCBan"
import PrivateBan from "../../database/PrivateBan"
import Whitelist from "../../database/Whitelist"
import ServerOnline from "../../database/ServerOnline"
import dateIsBetween from "./dateIsBetween"

export default async function handleMissedData({
	server,
	allServers,
	filter,
	database,
}: {
	server: ServerOnline
	allServers: ServerOnline[]
	filter: FilterObject
	database: Connection
}) {
	/*
	 The basic methodology here is to group everything by playername first.
	 T1 is the time that the server went offline, T2 is the time that the server went back online.
	 Then we check if a player has any privatebans against them at T1 and T2. If they do, we ban for the one at T2 (if they are the same, do nothing)
	 If they don't, we check if they have a whitelist at T2. If they do, we unban them (faster than checking if they were banned at T1).
	 If they don't, we check if they have valid reports at T1 and T2. If they are the same, do nothing. If they are different, we ban them for
	 the one at T2. If they don't have any reports at T2 but do at T1, we unban them. Do nothing if no reports at either.
	*/
	const allReports = await database.getRepository(FAGCBan).find()
	const privatebans = await database.getRepository(PrivateBan).find()
	const whitelist = await database.getRepository(Whitelist).find()

	// first, group them all by playername
	const reportsByPlayer = new Map<string, FAGCBan[]>()
	const privatebansByPlayer = new Map<string, PrivateBan[]>()
	const whitelistByPlayer = new Map<string, Whitelist[]>()
	const allPlayernames = new Set<string>()

	for (const report of allReports) {
		if (!reportsByPlayer.has(report.playername))
			reportsByPlayer.set(report.playername, [])
		reportsByPlayer.get(report.playername)!.push(report)
		allPlayernames.add(report.playername)
	}
	for (const privateban of privatebans) {
		if (!privatebansByPlayer.has(privateban.playername))
			privatebansByPlayer.set(privateban.playername, [])
		privatebansByPlayer.get(privateban.playername)!.push(privateban)
		allPlayernames.add(privateban.playername)
	}
	for (const whitelistEntry of whitelist) {
		if (!whitelistByPlayer.has(whitelistEntry.playername))
			whitelistByPlayer.set(whitelistEntry.playername, [])
		whitelistByPlayer.get(whitelistEntry.playername)!.push(whitelistEntry)
		allPlayernames.add(whitelistEntry.playername)
	}

	const privatebansToBan: (PrivateBan & { reban: boolean })[] = []
	const reportsToBan: (FAGCBan & { reban: boolean })[] = []
	const playersToUnban: string[] = []

	for (const playername of allPlayernames) {
		let shouldBeUnbanned = false

		const privatebans = privatebansByPlayer.get(playername)
		if (privatebans) {
			// check for the existence of privatebans at T1 and T2
			let privatebanAtT1: PrivateBan | null = null
			let privatebanAtT2: PrivateBan | null = null
			for (const privateban of privatebans) {
				// check the T1 date, which is when the server went offline
				if (
					!privatebanAtT1 &&
					dateIsBetween(
						server.offlineSince,
						privateban.createdAt,
						privateban.removedAt || new Date()
					)
				)
					privatebanAtT1 = privateban

				// check the T2 date, which is the current time
				if (
					!privatebanAtT2 &&
					dateIsBetween(
						new Date(),
						privateban.createdAt,
						privateban.removedAt || new Date()
					)
				)
					privatebanAtT2 = privateban
			}
			if (privatebanAtT1 == privatebanAtT2) {
				// if they are the same, the player stays banned for the same reason and we don't need to do anything
				continue
			} else if (privatebanAtT2) {
				privatebansToBan.push({
					...privatebanAtT2,
					reban: true,
				})
			} else if (privatebanAtT1 && !privatebanAtT2) {
				// there was a privateban at T1, but not at T2, so we should unban them (for now)
				shouldBeUnbanned = true
			}
		}

		const whitelists = whitelistByPlayer.get(playername)
		if (whitelists) {
			// check for the existence of whitelists at T2
			const whitelistAtT2 = whitelists.find((whitelist) =>
				dateIsBetween(
					new Date(),
					whitelist.createdAt,
					whitelist.removedAt || new Date()
				)
			)
			if (whitelistAtT2) {
				// if there is a whitelist at T2, we unban them
				// we don't care about anything else, as they are whitelisted so any reports against them should be ignored
				playersToUnban.push(playername)
				continue
			}
		}

		const reports = reportsByPlayer.get(playername)
		if (reports) {
			// filter reports only here, as it would be wasteful to filter reports against a player if they are whitelisted
			const filteredReports = reports.filter((report) => {
				if (
					filter.categoryFilters.includes(report.categoryId) &&
					filter.communityFilters.includes(report.communityId)
				)
					return true
				return false
			})
			// check for the existence of reports at T1 and T2
			let reportAtT1: FAGCBan | null = null
			let reportAtT2: FAGCBan | null = null
			for (const report of filteredReports) {
				// check the T1 date, which is when the server went offline
				if (
					!reportAtT1 &&
					dateIsBetween(
						server.offlineSince,
						report.createdAt,
						report.removedAt || new Date()
					)
				)
					reportAtT1 = report

				// check the T2 date, which is the current time
				if (
					!reportAtT2 &&
					dateIsBetween(
						new Date(),
						report.createdAt,
						report.removedAt || new Date()
					)
				)
					reportAtT2 = report
			}
			if (reportAtT1 == reportAtT2) {
				// if they are the same, the player stays banned for the same reason and we don't need to do anything
				continue
			} else if (reportAtT1 && reportAtT2) {
				// if there are reports at both T1 and T2 but aren't identical, we should reban them for T2
				reportsToBan.push({
					...reportAtT2,
					reban: true,
				})
			} else if (reportAtT2 && !reportAtT1) {
				// there is a valid report now but wasn't before, so we should ban them for the one at T2
				reportsToBan.push({
					...reportAtT2,
					reban: false,
				})
			} else if (reportAtT1 && !reportAtT2) {
				// there was a report at T1, but not at T2, so we should unban them (for now)
				shouldBeUnbanned = true
			}
			/*
				Other things that could happen are:
				- There are no valid reports at T1 and T2 (don't match filters) so we ignore them
			*/
		}

		if (shouldBeUnbanned) {
			playersToUnban.push(playername)
		}
	}

	// we now have all of the player lists assembled, but now we need to purge the database of data that is no longer relevant
	// i.e. should have been deleted and this was the last server that was supposed to use it
	const sortedOfflineDates = allServers
		.map((server) => {
			if (server.isOnline) return false
			return server.offlineSince
		})
		.filter((date): date is Date => date !== false)
		.sort()
	// the last offline date is the date that we clear until, or the current date if all servers are online
	const lastOfflineDate =
		sortedOfflineDates[sortedOfflineDates.length - 1] || new Date()
	await database
		.getRepository(FAGCBan)
		.createQueryBuilder()
		.delete()
		.where(`removedAt < :date`, {
			date: DateUtils.mixedDateToUtcDatetimeString(lastOfflineDate),
		})
		.execute()
	await database
		.getRepository(Whitelist)
		.createQueryBuilder()
		.delete()
		.where(`removedAt < :date`, {
			date: DateUtils.mixedDateToUtcDatetimeString(lastOfflineDate),
		})
		.execute()
	await database
		.getRepository(PrivateBan)
		.createQueryBuilder()
		.delete()
		.where(`removedAt < :date`, {
			date: DateUtils.mixedDateToUtcDatetimeString(lastOfflineDate),
		})
		.execute()

	return {
		privatebansToBan,
		reportsToBan,
		playersToUnban,
	}
}
