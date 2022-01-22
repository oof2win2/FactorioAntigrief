import { enableFetchMocks } from "jest-fetch-mock"
enableFetchMocks()
import { FAGCWrapper } from "../src/index"
import { createCommunity, createGuildConfig,  } from "./util"
import faker from "faker"
import util from "util"

const wrapper = new FAGCWrapper({
	masterapikey: "x",
	apikey: "x",
})

const testCommunities = Array(10).fill(0).map(() => createCommunity())

afterAll(() => wrapper.destroy())

beforeEach(() => wrapper.communities.clearCache())

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
		it("Should cache the community config", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			await wrapper.communities.getCommunityConfig({
				communityId: testCommunity.id,
			})

			expect(wrapper.communities.cache.size).toEqual(1) // the amount of cached communities should be only this added one
			expect(wrapper.communities.resolveID(testCommunity.id)).toEqual(testCommunity)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.getCommunityConfig({
					communityId: testCommunities[0].id,
				})
			).rejects.toThrow()
		})
	})

	describe("fetchCommunity", () => {
		it("Should be able to fetch a community", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			const fetchedCommunity = await wrapper.communities.fetchCommunity({
				communityId: testCommunity.id,
			})

			expect(fetchedCommunity).toEqual(testCommunity)
		})
		it("Should be able to cache the fetched community", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			await wrapper.communities.fetchCommunity({
				communityId: testCommunity.id,
			})

			expect(wrapper.communities.cache.size).toEqual(1) // the amount of cached communities should be only this added one
			expect(wrapper.communities.resolveID(testCommunity.id)).toEqual(testCommunity)
		})
		it("Fetching cache should work with communities returned", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockResponse(JSON.stringify(testCommunity))
		
			const communityOneProm = wrapper.communities.fetchCommunity({ communityId: testCommunity.id })
			const communityTwoProm = wrapper.communities.fetchCommunity({ communityId: testCommunity.id })
			await communityOneProm
			expect(util.inspect(communityTwoProm).includes("<pending>")).toBe(false)
		})
		it("Fetching cache should work with no communities returned", async () => {
			fetchMock.mockResponse(JSON.stringify(null))
		
			const communityOneProm = wrapper.communities.fetchCommunity({ communityId: "1" })
			const communityTwoProm = wrapper.communities.fetchCommunity({ communityId: "1" })
			await communityOneProm
			// communityTwoProm should NOT be pending
			expect(util.inspect(communityTwoProm).includes("<pending>")).toBe(false)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.fetchCommunity({
					communityId: testCommunities[0].id,
				})
			).rejects.toThrow()
		})
	})

	describe("fetchOwnCommunity", () => {
		it("Should be able to fetch own community", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			const fetchedCommunity = await wrapper.communities.fetchOwnCommunity({})

			expect(fetchedCommunity).toEqual(testCommunity)
		})
		it("Should cache the fetched community", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(testCommunity))
			await wrapper.communities.fetchOwnCommunity({})

			expect(wrapper.communities.cache.size).toEqual(1) // the amount of cached communities should be only this added one
			expect(wrapper.communities.resolveID(testCommunity.id)).toEqual(testCommunity)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.fetchOwnCommunity({})
			).rejects.toThrow()
		})
	})

	describe("setGuildConfig", () => {
		it("Should be able to set a guild config", async () => {
			const testGuildConfig = createGuildConfig()
			fetchMock.mockOnce(JSON.stringify(testGuildConfig))
			const resolvedConfig = await wrapper.communities.setGuildConfig({
				config: testGuildConfig,
			})

			expect(resolvedConfig).toEqual(testGuildConfig)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.setGuildConfig({
					config: createGuildConfig(),
				})
			).rejects.toThrow()
		})
	})

	describe("fetchGuildConfig", () => {
		it("Should be able to fetch a guild config", async () => {
			const testGuildConfig = createGuildConfig()
			fetchMock.mockOnce(JSON.stringify(testGuildConfig))
			const resolvedConfig = await wrapper.communities.fetchGuildConfig({
				guildId: testGuildConfig.guildId,
			})

			expect(resolvedConfig).toEqual(testGuildConfig)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.setGuildConfig({
					config: createGuildConfig(),
				})
			).rejects.toThrow()
		})
	})

	describe("create", () => {
		it("Should be able to create communities", async () => {
			const testCommunity = testCommunities[0]
			const apikey = faker.internet.password()
			fetchMock.mockOnce(JSON.stringify({
				community: testCommunity,
				apiKey: apikey
			}))
			const resolvedCommunity = await wrapper.communities.create(testCommunity)

			expect(resolvedCommunity.community).toEqual(testCommunity)
			expect(resolvedCommunity.apiKey).toEqual(apikey)
		})
		it("Should be able to cache the created community", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify({
				community: testCommunity,
				apiKey: faker.internet.password()
			}))
			await wrapper.communities.create(testCommunity)

			expect(wrapper.communities.cache.size).toEqual(1) // the amount of cached communities should be only this added one
			expect(wrapper.communities.resolveID(testCommunity.id)).toEqual(testCommunity)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.create(testCommunities[0])
			).rejects.toThrow()
		})
	})

	describe("createGuildConfig", () => {
		it("Should be able to set a guild config properly", async () => {
			const testGuildConfig = createGuildConfig()
			fetchMock.mockOnce(JSON.stringify(testGuildConfig))
			const resolvedConfig = await wrapper.communities.createGuildConfig({
				guildId: testGuildConfig.guildId,
			})

			expect(resolvedConfig).toEqual(testGuildConfig)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.createGuildConfig({
					guildId: "1"
				})
			).rejects.toThrow()
		})
	})

	describe("notifyGuildConfigChanged", () => {
		it("Should not throw an error", async () => {
			const testGuildConfig = createGuildConfig()
			fetchMock.mockOnce(JSON.stringify({ ok: true }))
			await expect(
				wrapper.communities.notifyGuildConfigChanged({
					guildId: testGuildConfig.guildId,
				})
			).resolves.not.toThrow()
		})
	})

	describe("guildLeave", () => {
		it("Should not throw an error", async () => {
			fetchMock.mockOnce(JSON.stringify({ ok: true }))
			await expect(
				wrapper.communities.guildLeave({
					guildId: "1"
				})
			).resolves.not.toThrow()
		})
	})

	describe("remove", () => {
		it("Should remove a community correctly", async () => {
			const testCommunity = testCommunities[0]
			fetchMock.mockOnce(JSON.stringify(true))
			const response = await wrapper.communities.remove({
				communityId: testCommunity.id,
			})
			expect(response).toEqual(true)
		})
		it("Should remove a community from cache after it being removed", async () => {
			const testCommunity = testCommunities[0]
			// add the community to the cache
			wrapper.communities.cache.set(testCommunity.id, testCommunity)
			fetchMock.mockOnce(JSON.stringify(true))
			await wrapper.communities.remove({
				communityId: testCommunity.id,
			})
			expect(wrapper.communities.cache.size).toEqual(0)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.remove({
					communityId: "1"
				})
			).rejects.toThrow()
		})
	})

	describe("merge", () => {
		it("Should correctly merge two communities", async () => {
			const [ testOne, testTwo ] = testCommunities
			fetchMock.mockOnce(JSON.stringify(testOne))
			const result = await wrapper.communities.merge({
				idReceiving: testOne.id,
				idDissolving: testTwo.id,
			})
			expect(result).toEqual(testOne)
		})
		it("Should remove the dissolved community from cache but keep the receiving", async () => {
			const [ testOne, testTwo ] = testCommunities

			// add the communities to cache
			wrapper.communities.cache.set(testOne.id, testOne)
			wrapper.communities.cache.set(testTwo.id, testTwo)

			fetchMock.mockOnce(JSON.stringify(testOne))
			const result = await wrapper.communities.merge({
				idReceiving: testOne.id,
				idDissolving: testTwo.id,
			})

			expect(result).toEqual(testOne)

			// the receiving community should still be in the cache
			expect(wrapper.communities.resolveID(testOne.id)).toEqual(testOne)
			// the dissolved community should not be in the cache anymore
			expect(wrapper.communities.resolveID(testTwo.id)).toBeNull()
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(
				wrapper.communities.merge({
					idReceiving: "1",
					idDissolving: "2"
				})
			).rejects.toThrow()
		})
	})
})