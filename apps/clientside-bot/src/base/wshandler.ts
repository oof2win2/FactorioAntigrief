import { WebSocketEvents } from "fagc-api-wrapper/dist/WebsocketListener"
import FAGCBot from "./FAGCBot"
import { MessageEmbed } from "discord.js"
import { GuildConfig, Report, Revocation } from "fagc-api-types"

interface HandlerOpts<T extends keyof WebSocketEvents> {
	event: Parameters<WebSocketEvents[T]>[0]
	client: FAGCBot
}

export const communityCreated = ({
	client,
	event,
}: HandlerOpts<"communityCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const communityRemoved = ({
	client,
	event,
}: HandlerOpts<"communityRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const categoryCreated = ({
	client,
	event,
}: HandlerOpts<"categoryCreated">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const categoryRemoved = async ({
	client,
	event,
}: HandlerOpts<"categoryRemoved">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	client.infochannels.forEach((guildChannels) => {
		guildChannels.forEach((c) => {
			const channel = client.channels.cache.get(c.channelId)
			if (!channel || !channel.isNotDMChannel()) return
			client.addEmbedToQueue(channel.id, embed)
		})
	})
}

export const report = async ({ client, event }: HandlerOpts<"report">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	let shouldPerformActions = false
	const guildConfigs: GuildConfig[] = []

	client.guilds.cache.forEach((guild) => {
		const guildConfig = client.guildConfigs.get(guild.id)
		if (!guildConfig) return
		const infochannels = client.infochannels.get(guild.id)
		if (
			guildConfig.categoryFilters?.includes(event.report.categoryId) &&
			guildConfig.trustedCommunities?.includes(event.report.communityId)
		) {
			if (infochannels) {
				infochannels.forEach((c) => {
					const channel = client.channels.cache.get(c.channelId)
					if (!channel || !channel.isNotDMChannel()) return
					client.addEmbedToQueue(channel.id, embed)
				})
			}
			shouldPerformActions = true
			guildConfigs.push(guildConfig)
		}
	})

	if (!shouldPerformActions) return // did not match any filters so return

	reportHandler(client, guildConfigs, event.report)
}
/**
 * @param guildConfigs array of guild configs that are affected by the revocation, i.e. it matches their community and category filters
 */
const reportHandler = async (
	client: FAGCBot,
	guildConfigs: GuildConfig[],
	report: Report
) => {
	const isWhitelisted = await client.db.whitelist.findFirst({
		where: {
			playername: report.playername,
		},
	})
	if (isWhitelisted) return // if the player is whitelisted, don't do anything

	// create the record for future safekeeping
	await client.db.fagcBan.create({
		data: {
			id: report.id,
			playername: report.playername,
			categoryId: report.categoryId,
			communityId: report.communityId,
		},
	})

	// ban in guilds that its supposed to
	guildConfigs.map((guildConfig) => {
		const command = client.createBanCommand(report, guildConfig.guildId)
		if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
		client.rcon.rconCommandGuild(
			`/sc ${command}; rcon.print(true)`,
			guildConfig.guildId
		)
	})
}

export const revocation = async ({
	client,
	event,
}: HandlerOpts<"revocation">) => {
	const embed = new MessageEmbed({ ...event.embed, type: undefined })

	let shouldPerformActions = false
	const guildConfigs: GuildConfig[] = []

	client.guilds.cache.forEach((guild) => {
		const guildConfig = client.guildConfigs.get(guild.id)
		if (!guildConfig) return
		const infochannels = client.infochannels.get(guild.id)
		if (
			guildConfig.categoryFilters?.includes(
				event.revocation.categoryId
			) &&
			guildConfig.trustedCommunities?.includes(
				event.revocation.communityId
			)
		) {
			if (infochannels) {
				infochannels.forEach((c) => {
					const channel = client.channels.cache.get(c.channelId)
					if (!channel || !channel.isNotDMChannel()) return
					client.addEmbedToQueue(channel.id, embed)
				})
			}
			shouldPerformActions = true
			guildConfigs.push(guildConfig)
		}
	})

	if (!shouldPerformActions) return // did not match any filters so return

	revocationHandler(client, guildConfigs, event.revocation)
}
/**
 * @param guildConfigs array of guild configs that are affected by the revocation, i.e. it matches their community and category filters
 */
const revocationHandler = async (
	client: FAGCBot,
	guildConfigs: GuildConfig[],
	revocation: Revocation
) => {
	// remove the report record
	await client.db.fagcBan
		.delete({
			where: {
				id: revocation.id,
			},
		})
		.catch(() => null)

	const isPrivateBanned = await client.db.privatebans.findFirst({
		where: {
			playername: revocation.playername,
		},
	})
	if (isPrivateBanned) return // if the player is blacklisted, don't do anything

	const otherBan = await client.db.fagcBan.findFirst({
		where: {
			playername: revocation.playername,
		},
	})

	// unban the player where it is wanted
	await Promise.allSettled(
		guildConfigs.map((guildConfig) => {
			const command = client.createUnbanCommand(
				revocation.playername,
				guildConfig.guildId
			)
			if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
			client.rcon.rconCommandGuild(
				`/sc ${command}; rcon.print(true)`,
				guildConfig.guildId
			)
		})
	)

	// if there is another FAGC report that conforms to the categories + communities, perform desired actions with it
	if (otherBan) {
		// there are other reports that the player is still banned for
		const report = await client.fagc.reports.fetchReport({
			reportId: otherBan.id,
		})
		if (!report) return
		// unban in guilds that its supposed to
		guildConfigs.map((guildConfig) => {
			const command = client.createBanCommand(report, guildConfig.guildId)
			if (!command) return // if it is not supposed to do anything in this guild, then it won't do anything
			client.rcon.rconCommandGuild(
				`/sc ${command}; rcon.print(true)`,
				guildConfig.guildId
			)
		})
	}
}

export const guildConfigChanged = async ({
	client,
	event,
}: HandlerOpts<"guildConfigChanged">) => {
	client.guildConfigs.set(event.config.guildId, event.config) // set the new config

	// unban everyone if no filtered categories or communities on the new config
	if (
		!event.config.categoryFilters?.length ||
		!event.config.trustedCommunities?.length
	) {
		const currentReports = await client.db.fagcBan.findMany()
		const playernames: Set<string> = new Set()
		currentReports.map((record) => playernames.add(record.playername))
		await client.db.fagcBan.deleteMany() // delete all the records
		// transform playernames into an array and split into chunks of 500
		const toUnbanChunks = Array.from(playernames).reduce<string[][]>(
			(acc, name) => {
				const last = acc[acc.length - 1]
				if (!last || last.length >= 500) {
					acc.push([])
				}
				acc[acc.length - 1].push(name)
				return acc
			},
			[]
		)
		// iterate over the chunks with a for loop and unban the players
		for (const players of toUnbanChunks) {
			// map over the players and create an unban command for each
			const command = players
				.map((playername) =>
					client.createUnbanCommand(playername, event.config.guildId)
				)
				.join(";")
			await client.rcon.rconCommandGuild(
				`/sc ${command}; rcon.print(true)`,
				event.config.guildId
			)
			// sleep for 25ms to prevent servers from getting stuck
			await new Promise((resolve) => setTimeout(resolve, 25))
		}
		return
	}
	const newConfig = event.config as typeof event.config &
		Pick<
			Required<typeof event.config>,
			"categoryFilters" | "trustedCommunities"
		>
	// run both at once and then wait for both to finish so no extra time is spent waiting around
	const [newReports, currentReports, whitelistRecords, privatebanRecords] =
		await Promise.all([
			client.fagc.reports.list({
				categoryIds: newConfig.categoryFilters,
				communityIds: newConfig.trustedCommunities,
			}),
			client.db.fagcBan.findMany(),
			client.db.whitelist.findMany(),
			client.db.privatebans.findMany(),
		])

	const playersToUnban: Set<string> = new Set()

	// array of report IDs that can be removed
	const toRemoveIds = currentReports
		.map((record) => {
			// check whether the record is no longer in categories that should be forgiven
			if (!newConfig.categoryFilters.includes(record.categoryId)) {
				playersToUnban.add(record.playername)
				return record.id
			}
			if (!newConfig.trustedCommunities.includes(record.communityId)) {
				playersToUnban.add(record.playername)
				return record.id
			}
			// the record is now deemed appicable and still should still be banned by
			return false
		})
		.filter((id): id is string => Boolean(id))

	// remove the record of reports that are no longer deemed valid for this community
	await client.db.fagcBan.deleteMany({
		where: {
			id: {
				in: toRemoveIds,
			},
		},
	})

	const whitelistedPlayers = new Set(
		whitelistRecords.map((w) => w.playername)
	)
	const privatebannedPlayers = new Set(
		privatebanRecords.map((p) => p.playername)
	)

	const toBanReports = newReports
		.map((report) => {
			if (whitelistedPlayers.has(report.playername)) return // player is whitelisted, do nothing
			if (privatebannedPlayers.has(report.playername)) return // player is privately banned, don't store useless data

			playersToUnban.delete(report.playername)
			return report
		})
		.filter((r): r is Report => Boolean(r))

	// transform playersToUnban into an array and split into chunks of 500
	const toUnbanChunks = Array.from(playersToUnban).reduce<string[][]>(
		(acc, name) => {
			const last = acc[acc.length - 1]
			if (!last || last.length >= 500) {
				acc.push([])
			}
			acc[acc.length - 1].push(name)
			return acc
		},
		[]
	)
	// iterate over the chunks with a for loop and unban the players
	for (const players of toUnbanChunks) {
		// map over the players and create an unban command for each
		const command = players
			.map((playername) =>
				client.createUnbanCommand(playername, event.config.guildId)
			)
			.filter((x): x is string => Boolean(x))
			.join(";")
		await client.rcon.rconCommandGuild(
			`/sc ${command}; rcon.print(true)`,
			event.config.guildId
		)
		// sleep for 25ms to prevent servers from getting stuck
		await new Promise((resolve) => setTimeout(resolve, 25))
	}

	// transform toBanReports into an array and split into chunks of 500
	const toBanChunks = Array.from(toBanReports).reduce<Report[][]>(
		(acc, report) => {
			const last = acc[acc.length - 1]
			if (!last || last.length >= 500) {
				acc.push([])
			}
			acc[acc.length - 1].push(report)
			return acc
		},
		[]
	)
	// iterate over the chunks with a for loop and ban the players
	for (const reports of toBanChunks) {
		// map over the players and create a ban command for each
		const command = reports
			.map((report) =>
				client.createBanCommand(report, event.config.guildId)
			)
			.join(";")
		await client.rcon.rconCommandGuild(
			`/sc ${command}; rcon.print(true)`,
			event.config.guildId
		)
		// sleep for 25ms to prevent servers from getting stuck
		await new Promise((resolve) => setTimeout(resolve, 25))
	}

	// create the records of the reports in the db

	const newRecords = toBanReports.map(
		(report) =>
			`('${report.id}', '${report.playername}', '${report.categoryId}', '${report.communityId}')`
	)
	// split newRecords into arrays of 500 and join them with a comma
	const newRecordChunks = Array.from(newRecords).reduce<string[][]>(
		(acc, record) => {
			const last = acc[acc.length - 1]
			if (!last || last.length >= 500) {
				acc.push([])
			}
			acc[acc.length - 1].push(record)
			return acc
		},
		[]
	)
	// iterate over the chunks with a for loop and insert the records into the db
	for (const records of newRecordChunks) {
		await client.db.$executeRawUnsafe(
			`INSERT OR IGNORE INTO \`main\`.\`fagcban\` (id, playername, categoryId, communityId) VALUES ${records.join(
				","
			)};`
		)
		// wait for 50ms to allow other queries to run
		await new Promise((resolve) => setTimeout(resolve, 50))
	}
}
