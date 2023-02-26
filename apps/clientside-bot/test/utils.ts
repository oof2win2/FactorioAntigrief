import {
	Category,
	Community,
	FilterObject,
	GuildConfig,
	Report,
	Revocation,
} from "@fdgl/types"
import faker from "faker"
import FDGLBan from "../src/database/FDGLBan"
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
const existingFDGLIds = new Set<string>()
export const createFDGLId = (): string => {
	const id = faker.random.alphaNumeric(6)
	if (existingFDGLIds.has(id)) return createFDGLId()
	existingFDGLIds.add(id)
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

export const createFDGLReport = ({
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
		id: createFDGLId(),
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

export const createFDGLRevocation = ({
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
		filterObjectId: createFDGLId(),
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

export const createFDGLCategory = (): Category => {
	return {
		id: createFDGLId(),
		name: faker.lorem.words(),
		description: faker.lorem.sentence(10),
	}
}

export const createFDGLCommunity = (): Community => {
	return {
		id: createFDGLId(),
		name: faker.lorem.words(),
		contact: createDiscordId(),
		guildIds: createTimes(
			createDiscordId,
			[],
			faker.datatype.number({ min: 1, max: 5 })
		),
		tokenInvalidBefore: faker.date.past(),
		filterObjectId: createFDGLId(),
	}
}

export const createFDGLBan = ({
	categoryIds,
	communityIds,
	playernames,
	createdAt,
}: {
	categoryIds: string[]
	communityIds: string[]
	playernames?: string[]
	createdAt: Date
}): FDGLBan => {
	return {
		id: createFDGLId(),
		playername: (playernames
			? randomElementFromArray(playernames)
			: faker.internet.userName()
		).slice(0, 60),
		categoryId: randomElementFromArray(categoryIds),
		communityId: randomElementFromArray(communityIds),
		reportCreatedAt: createdAt,
		automated: false,
		adminId: createDiscordId(),
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

export const reportIntoFDGLBan = (report: Report): FDGLBan => {
	return {
		id: report.id,
		playername: report.playername,
		categoryId: report.categoryId,
		communityId: report.communityId,
		automated: report.automated,
		reportCreatedAt: report.reportCreatedAt,
		adminId: report.adminId,
	}
}
