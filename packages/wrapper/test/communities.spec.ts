import { enableFetchMocks } from "jest-fetch-mock"
enableFetchMocks()
import { FAGCWrapper } from "../src/index"
import "cross-fetch"
import { createCommunity,  } from "./util"

const wrapper = new FAGCWrapper({
	masterapikey: "x",
	apikey: "x",
})

const testCommunities = Array(10).fill(0).map(() => createCommunity())

afterAll(() => wrapper.destroy())

beforeEach(() => wrapper.communities.clearCache())

// describe("Communities", () => {
// describe("setCommunityConfig", () => {
// 	it("Should be able to set a community's config", async () => {
// 		const testCommunity = testCommunities[0]
// 		fetchMock.mockOnce(JSON.stringify(testCommunity))
// 		const resolvedConfig = await wrapper.communities.setCommunityConfig({
// 			config: testCommunity,
// 		})

// 		expect(resolvedConfig).toEqual(testCommunity)
// 	})
// 	it("Should cache the community config after setting it", async () => {
// 		const testCommunity = testCommunities[0]
// 		fetchMock.mockOnce(JSON.stringify(testCommunity))
// 		const resolvedConfig = await wrapper.communities.setCommunityConfig({
// 			config: testCommunity,
// 		})

// 		expect(wrapper.communities.cache.size).toEqual(1) // the amount of cached communities should be only this added one
// 		expect(resolvedConfig).toEqual(wrapper.communities.resolveID(testCommunity.id))
// 	})
// 	it("Should throw an error if an incorrect response is given from the API", async () => {
// 		fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
// 		await expect(
// 			wrapper.communities.setCommunityConfig({
// 				config: testCommunities[0],
// 			})
// 		).rejects.toThrow()
// 	})
// })
// describe("getCommunityConfig", () => {
// 	it("Should be able to fetch a community config", async () => {
// 		const testCommunity = testCommunities[0]
// 		fetchMock.mockOnce(JSON.stringify(testCommunity))
// 		const fetchedConfig = await wrapper.communities.getCommunityConfig({
// 			communityId: testCommunity.id,
// 		})

// 		expect(fetchedConfig).toEqual(testCommunity)
// 	})
// 	// it("Should cache the community config")
// })
// })

describe("Communities", () => {
	describe("fetchAll", () => {
		it("Should be able to fetch all communities", async () => {
			fetchMock.mockOnce(JSON.stringify(testCommunities))
			const communities = await wrapper.communities.fetchAll({})

			expect(communities.length).toBe(testCommunities.length)
			communities.map((community, i) => {
				const originalCommunity = testCommunities[i]
				expect(community).toEqual(originalCommunity)
			})
		})
		it("Should cache communities after fetching them", async () => {
			fetchMock.mockOnce(JSON.stringify(testCommunities))
			const communities = await wrapper.communities.fetchAll({})

			expect(wrapper.communities.cache.size).toEqual(testCommunities.length) // the amount of communities should be the same

			communities.map((community) => {
				// the different communities should be cached properly too
				const resolved = wrapper.communities.resolveID(community.id)
				expect(resolved).toEqual(community)
			})
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.communities.fetchAll({})).rejects.toThrow()
		})
	})
	describe("setCommunityConfig", () => {
		it("Should be able to set a community's config", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			const resolvedConfig = await wrapper.communities.setCommunityConfig({
				config: testCommunity,
			})

			expect(resolvedConfig).toEqual(testCommunity)
		})
		it("Should cache the community config after setting it", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			const resolvedConfig = await wrapper.communities.setCommunityConfig({
				config: testCommunity,
			})

			expect(wrapper.communities.cache.size).toEqual(1) // the amount of cached communities should be only this added one
			expect(resolvedConfig).toEqual(wrapper.communities.resolveID(testCommunity.id))
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.setCommunityConfig({
					config: testCommunities[0],
				})
			).rejects.toThrow()
		})
	})
	describe("getCommunityConfig", () => {
		it("Should be able to fetch a community config", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			const fetchedConfig = await wrapper.communities.getCommunityConfig({
				communityId: testCommunity.id,
			})

			expect(fetchedConfig).toEqual(testCommunity)
		})
		// it("Should cache the community config")
	})
})