import { Category, Community, GuildConfig, Report } from "fagc-api-types"
import faker from "faker"

export const createTimes = <T>(creator: () => T, count?: number): T[] => {
	if (!count) {
		count = faker.datatype.number()
	}
	return Array.from({ length: count }, creator)
}

export const createFAGCId = (): string => {
	return faker.datatype.hexaDecimal(6)
}

/**
 * Get a random element from the provided array
 */
const randomElementFromArray = <T>(array: T[]): T => {
	return array[Math.floor(Math.random() * array.length)]
}

const randomElementsFromArray = <T>(array: T[], count?: number): T[] => {
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
}: {
	categoryIds: string[]
	communityIds: string[]
}): Report => {
	return {
		id: createFAGCId(),
		playername: faker.internet.userName(),
		categoryId: randomElementFromArray(categoryIds),
		communityId: randomElementFromArray(communityIds),
		description: faker.lorem.sentence(),
		proof: faker.lorem.sentence(),
		reportCreatedAt: faker.date.past(),
		reportedTime: faker.date.past(),
		automated: Math.random() > 0.5,
		adminId: createDiscordId(),
	}
}

export const createGuildConfig = ({
	categoryIds,
	communityIds,
}: {
	categoryIds: string[]
	communityIds: string[]
}): GuildConfig => {
	return {
		guildId: createDiscordId(),
		categoryFilters: randomElementsFromArray(categoryIds),
		trustedCommunities: randomElementsFromArray(communityIds),
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
			faker.datatype.number({ min: 1, max: 5 })
		),
		tokenInvalidBefore: faker.date.past(),
	}
}
