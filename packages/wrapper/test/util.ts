import { Community, GuildConfig, Category } from "fagc-api-types"
import faker from "faker"

export const createCategory = (): Category => {
	return {
		id: faker.datatype.uuid(),
		name: faker.random.word(),
		description: faker.random.words(),
	}
}
export const createCommunity = (): Community => {
	return {
		id: faker.datatype.uuid(),
		name: faker.random.word(),
		contact: faker.datatype.number().toString(),
		guildIds: Array(faker.datatype.number(5))
			.fill(0)
			.map(() => faker.datatype.number().toString()),
		tokenInvalidBefore: faker.date.past(),
		filterObjectId: faker.datatype.string(),
	}
}
export const createGuildConfig = (): GuildConfig => {
	return {
		guildId: faker.datatype.number().toString(),
		filterObjectId: faker.datatype.string(),
		roles: {
			setCommunities: faker.datatype.string(),
			setCategories: faker.datatype.string(),
			webhooks: faker.datatype.string(),
			reports: faker.datatype.string(),
			setConfig: faker.datatype.string(),
		},
		apikey: faker.datatype.boolean() ? faker.internet.password() : null,
	}
}
