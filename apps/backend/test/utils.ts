import cryptoRandomString from "crypto-random-string"
import { Community, Category } from "fagc-api-types"
import * as faker from "faker"

export function createId() {
	return cryptoRandomString({ length: 6, type: "alphanumeric" })
}

export function createSnowflake() {
	return String(Math.round(Math.random() * 2 ** 63))
}

export const createCommunity = (): Community => {
	return {
		id: createId(),
		name: faker.datatype.string(),
		contact: createSnowflake(),
		tokenInvalidBefore: faker.date.past(),
		guildIds: [],
		filterObjectId: createId(),
	}
}
export const createCommunities = (count: number): Community[] => {
	return Array(count)
		.fill(0)
		.map(() => createCommunity())
}

export const createCategory = (): Category => {
	return {
		id: createId(),
		name: faker.lorem.word(),
		description: faker.lorem.sentence(),
	}
}
export const createCategories = (count: number): Category[] => {
	return Array(count)
		.fill(0)
		.map(() => createCategory())
}

export function createReport(props = {}) {
	return {
		playername: faker.lorem.word(),
		communityId: createId(),
		categoryId: createId(),
		proof: "No proof",
		description: "No description",
		automated: false,
		reportedTime: new Date(),
		adminId: createSnowflake(),
		reportCreatedAt: new Date(),
		...props,
	}
}

export function createRevocation(props = {}) {
	return {
		...createReport(),
		revokedBy: createSnowflake(),
		revokedAt: new Date(),
		...props,
	}
}

// Convets a model to JSON and back again, removing _id and __v
export function toJson(model: any) {
	const result = JSON.parse(JSON.stringify(model))
	delete result._id
	delete result.__v
	return result
}
