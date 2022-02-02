import { Community, Category } from "fagc-api-types"
import * as faker from "faker"

export const createCommunity = (): Community => {
	return {
		id: faker.datatype.uuid(),
		name: faker.datatype.string(),
		contact: faker.datatype.uuid(),
		tokenInvalidBefore: faker.date.past(),
		guildIds: [],
	}
}
export const createCommunities = (count: number): Community[] => {
	return Array(count).fill(0).map(() => createCommunity())
}

export const createCategory = (): Category => {
	return {
		id: faker.datatype.uuid(),
		name: faker.lorem.word(),
		description: faker.lorem.sentence(),
	}
}
export const createCategories = (count: number): Category[] => {
	return Array(count).fill(0).map(() => createCategory())
}