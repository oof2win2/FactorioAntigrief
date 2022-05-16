import {
	Category,
	Community,
	FilterObject,
	GuildConfig,
	Report,
	Revocation,
} from "fagc-api-types"
import faker from "faker"
import FAGCBan from "../src/database/FAGCBan"
import PrivateBan from "../src/database/PrivateBan"
import Whitelist from "../src/database/Whitelist"

export function createTimes<F extends (...args: any[]) => any>(
	creator: F,
	params: Parameters<F> | (() => Parameters<F>),
	count: number
): ReturnType<F>[]
export function createTimes<F extends () => any>(
	creator: F,
	count: number
): ReturnType<F>[]
export function createTimes<F extends (...args: any[]) => any>(
	creator: F,
	params: Parameters<F> | (() => Parameters<F>) | number,
	count?: number
): ReturnType<F>[] {
	if (typeof params === "number") {
		return Array.from({ length: params }, () => creator())
	}

	// TODO: remove the type cast when i figure out why `count` can be undefined here according to types - which it can't
	return Array.from({ length: count as number }, () =>
		typeof params === "function" ? creator(...params()) : creator(...params)
	)
}

// this is to make sure that the IDs are unique
const existingFAGCIds = new Set<string>()
export const createFAGCId = (): string => {
	const id = faker.random.alphaNumeric(6)
	if (existingFAGCIds.has(id)) return createFAGCId()
	existingFAGCIds.add(id)
	return id
}

/**
 * Get a random element from the provided array
 */
export const randomElementFromArray = <T>(array: T[]): T => {
	return array[Math.floor(Math.random() * array.length)]
}

export const randomElementsFromArray = <T>(array: T[], count?: number): T[] => {
	if (!count) {
		count = Math.floor(Math.random() * array.length) + 1
	}
	return (
		array
			// sort the array randomly
			.sort(() => 0.5 - Math.random())
			// get the first count elements of the randomly sorted array
			.slice(0, count)
	)
}

const createDiscordId = (): string => {
	return faker.datatype
		.number({
			min: 1e17, // discord user id
			max: 1e19,
		})
		.toString()
}

export const createFAGCReport = ({
	categoryIds,
	communityIds,
	playernames,
	adminIds,
}: {
	categoryIds: string[]
	communityIds: string[]
	playernames?: string[]
	adminIds?: string[]
}): Report => {
	return {
		id: createFAGCId(),
		playername: (playernames
			? randomElementFromArray(playernames)
			: faker.internet.userName()
		).slice(0, 60),
		categoryId: randomElementFromArray(categoryIds),
		communityId: randomElementFromArray(communityIds),
		description: faker.lorem.sentence(10),
		proof: faker.lorem.sentence(10),
		reportCreatedAt: faker.date.past(),
		reportedTime: faker.date.past(),
		automated: Math.random() > 0.5,
		adminId: adminIds
			? randomElementFromArray(adminIds)
			: createDiscordId(),
	}
}

export const createFAGCRevocation = ({
	report,
}: {
	report: Report
}): Revocation => {
	return {
		...report,
		revokedAt: faker.date.past(),
		revokedBy: createDiscordId(),
	}
}

export const createGuildConfig = ({
	categoryIds,
	communityIds,
	includeAllFilters,
}: {
	categoryIds: string[]
	communityIds: string[]
	includeAllFilters?: boolean
}): [GuildConfig, FilterObject] => {
	const guildConfig: GuildConfig = {
		guildId: createDiscordId(),
		filterObjectId: createFAGCId(),
		roles: {
			reports: createDiscordId(),
			webhooks: createDiscordId(),
			setConfig: createDiscordId(),
			setCategories: createDiscordId(),
			setCommunities: createDiscordId(),
		},
	}
	const filterObject: FilterObject = {
		id: guildConfig.filterObjectId,
		categoryFilters: includeAllFilters
			? categoryIds
			: randomElementsFromArray(
					categoryIds,
					Math.round(categoryIds.length / 2)
			  ),
		communityFilters: includeAllFilters
			? communityIds
			: randomElementsFromArray(
					communityIds,
					Math.round(communityIds.length / 2)
			  ),
	}
	return [guildConfig, filterObject]
}

export const createFAGCCategory = (): Category => {
	return {
		id: createFAGCId(),
		name: faker.lorem.words(),
		description: faker.lorem.sentence(10),
	}
}

export const createFAGCCommunity = (): Community => {
	return {
		id: createFAGCId(),
		name: faker.lorem.words(),
		contact: createDiscordId(),
		guildIds: createTimes(
			createDiscordId,
			[],
			faker.datatype.number({ min: 1, max: 5 })
		),
		tokenInvalidBefore: faker.date.past(),
		filterObjectId: createFAGCId(),
	}
}

export const createFAGCBan = ({
	categoryIds,
	communityIds,
	playernames,
}: {
	categoryIds: string[]
	communityIds: string[]
	playernames?: string[]
}): FAGCBan => {
	return {
		id: createFAGCId(),
		playername: (playernames
			? randomElementFromArray(playernames)
			: faker.internet.userName()
		).slice(0, 60),
		categoryId: randomElementFromArray(categoryIds),
		communityId: randomElementFromArray(communityIds),
	}
}

export const createWhitelist = ({
	playernames,
	adminIds,
}: {
	playernames?: string[]
	adminIds?: string[]
}): Whitelist => {
	return {
		id: faker.datatype.number(),
		playername: (playernames
			? randomElementFromArray(playernames)
			: faker.internet.userName()
		).slice(0, 60),
		reason: faker.lorem.sentence(10),
		createdAt: faker.date.past(),
		adminId: adminIds
			? randomElementFromArray(adminIds)
			: createDiscordId(),
	}
}

export const createPrivateban = ({
	playernames,
	adminIds,
}: {
	playernames?: string[]
	adminIds?: string[]
}): PrivateBan => {
	return {
		id: faker.datatype.number(),
		playername: (playernames
			? randomElementFromArray(playernames)
			: faker.internet.userName()
		).slice(0, 60),
		reason: faker.lorem.sentence(10),
		createdAt: faker.date.past(),
		adminId: adminIds
			? randomElementFromArray(adminIds)
			: createDiscordId(),
	}
}

export const reportIntoFAGCBan = (report: Report): FAGCBan => {
	return {
		id: report.id,
		playername: report.playername,
		categoryId: report.categoryId,
		communityId: report.communityId,
	}
}
