import { Category, Community, GuildConfig, Report } from "fagc-api-types"
import faker from "faker"

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
		playername: playernames
			? randomElementFromArray(playernames)
			: faker.internet.userName(),
		categoryId: randomElementFromArray(categoryIds),
		communityId: randomElementFromArray(communityIds),
		description: faker.lorem.sentence(),
		proof: faker.lorem.sentence(),
		reportCreatedAt: faker.date.past(),
		reportedTime: faker.date.past(),
		automated: Math.random() > 0.5,
		adminId: adminIds
			? randomElementFromArray(adminIds)
			: createDiscordId(),
	}
}
type x = Parameters<typeof createFAGCReport>
export const createGuildConfig = ({
	categoryIds,
	communityIds,
}: {
	categoryIds: string[]
	communityIds: string[]
}): GuildConfig => {
	return {
		guildId: createDiscordId(),
		categoryFilters: randomElementsFromArray(
			categoryIds,
			Math.round(categoryIds.length / 2)
		),
		trustedCommunities: randomElementsFromArray(
			communityIds,
			Math.round(communityIds.length / 2)
		),
		roles: {
			reports: createDiscordId(),
			webhooks: createDiscordId(),
			setConfig: createDiscordId(),
			setCategories: createDiscordId(),
			setCommunities: createDiscordId(),
		},
	}
}

export const createFAGCCategory = (): Category => {
	return {
		id: createFAGCId(),
		name: faker.lorem.words(),
		description: faker.lorem.sentence(),
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
	}
}
