import { Community, GuildConfig, Category } from "fagc-api-types"
import faker from "faker"

export const createCategory = (): Category => {
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
		guildIds: Array(faker.datatype.number(5)).fill(0).map(() => faker.datatype.number().toString()),
		tokenInvalidBefore: faker.date.past(),
	}
}
export const createGuildConfig = (): GuildConfig => {
	return {
		guildId: faker.datatype.number().toString(),
		categoryFilters: Array(faker.datatype.number(5)).fill((() => faker.datatype.string(6))()), // the bracket mess is to create strings
		trustedCommunities: Array(faker.datatype.number(5)).fill((() => faker.datatype.string(6))()),
		roles: {
			setCommunities: faker.datatype.string(),
			setCategories: faker.datatype.string(),
			webhooks: faker.datatype.string(),
			reports: faker.datatype.string(),
			setConfig: faker.datatype.string(),
		},
		apiKey: faker.datatype.boolean() ? faker.internet.password() : null,
	}
}