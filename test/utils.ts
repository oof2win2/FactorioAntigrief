import { Community, Rule } from "fagc-api-types"
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

export const createRule = (): Rule => {
	return {
		id: faker.datatype.uuid(),
		shortdesc: faker.lorem.word(),
		longdesc: faker.lorem.sentence(),
	}
}
export const createRules = (count: number): Rule[] => {
	return Array(count).fill(0).map(() => createRule())
}