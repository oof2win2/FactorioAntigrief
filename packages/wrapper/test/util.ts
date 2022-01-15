import { Community, Rule } from "fagc-api-types"
import faker from "faker"

export const createRule = (): Rule => {
	return {
		id: faker.datatype.uuid(),
		shortdesc: faker.random.word(),
		longdesc: faker.random.words(),
	}
}
export const createCommunity = (): Community => {
	return {
		id: faker.datatype.uuid(),
		name: faker.random.word(),
		contact: faker.datatype.number().toString(),
		guildIds: Array(faker.datatype.number()).fill(0).map(() => faker.datatype.number().toString()),
	}
}