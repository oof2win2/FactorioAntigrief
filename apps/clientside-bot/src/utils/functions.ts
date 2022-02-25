import { Guild, TextChannel } from "discord.js"
import { GuildConfig, Report, Revocation } from "fagc-api-types"
import { Connection, In, Not } from "typeorm"
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
			- Remove reports from the database that are no longer valid, such as rules or communities that have been removed
			- Create reports in the database if they match rule and community filters, even if the player is privately banned
			- Keep in mind, that some people's reports *still may be valid* in other guilds, so we need to keep track of which guilds they are valid in and not remove them from the DB outright
	*/

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
