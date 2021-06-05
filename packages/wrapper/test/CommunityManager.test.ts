import CommunityManager from "../src/CommunityManager"
import { Community, ApiID } from "../src/types/apitypes"
import config from "./testconfig"
import ApiWrapper from "../src/index"

import { expect } from 'chai';

const FAGC = new ApiWrapper(config.apikey)


describe("CommunityManager", () => {
	const Communities = FAGC.communities
	let testingID
	before(async () => {
		testingID = await Communities.fetchAll().then(c=>c[0].id)
		Communities.cache.clear()
	})

	describe("#fetchCommunity()", () => {
		beforeEach(() => {
			Communities.cache.clear() // clear community cache
		})
		it("Should fetch community correctly", async () => {
			const fetched = await Communities.fetchCommunity(testingID)
			expect(fetched.id).to.equal(testingID)
		})
		it("Should take a shorter amount of time to fetch when result is cached", async () => {
			const beforeFetch = performance.now()
			await Communities.fetchCommunity(testingID)
			const afterFetch = performance.now()
			await Communities.fetchCommunity(testingID)
			const afterCached = performance.now()
			expect((afterFetch - beforeFetch < afterCached - afterFetch), `Time to fetch after cached (${afterCached - afterFetch}ms) took longer than before cached (${afterFetch - beforeFetch}ms)`).to.equal(false)
			expect(afterCached - afterFetch, "Took more than 1ms to get supposedly cached result").to.be.lessThanOrEqual(1)
		})
		it("Should not fetch non-existent community", async () => {
			const wrongID = "potatoe"
			const fetched = await Communities.fetchCommunity(wrongID)
			expect(fetched).to.equal(null)
		})
	})
	describe("#fetchAll()", () => {
		beforeEach(() => {
			Communities.cache.clear() // clear community cache
		})
		it("Should fetch all communities", async () => {
			const fetched = await Communities.fetchAll()
			if (fetched[0])
				expect(fetched[0].id).to.not.equal(null)
		})
		it("Should fetch all communities and cache them properly", async () => {
			const fetched = await Communities.fetchAll()
			expect(fetched.length, "Amount of cached communities was not equal to amount of fetched communities").to.equal(Communities.cache.size)
		})
	})
	describe("#resolveID()", () => {
		it("Should resolve quickly if cached", async () => {
			const fetched = await Communities.fetchCommunity(testingID)
			const resolved = Communities.resolveID(testingID)
			expect(resolved, "Resolved and fetched should be the same").deep.equal(fetched)
			expect(resolved.id).to.equal(testingID)
		})
	})
	describe("#fetchConfig()", () => {
		it("Should fetch a config correctly", async () => {
			const fetched = await Communities.fetchConfig(config.guildid)
			expect(fetched.guildid).to.deep.equal(config.guildid)
		})
	})
	describe("#setConfig()", () => {
		it("Should properly set a config", async () => {
			const trustedCommunities = ["qj8n58c", "p1UgG0G"]
			const previousConfig = await Communities.fetchConfig(config.guildid)
			const newConfig = await Communities.setConfig({trustedCommunities}, {apikey: config.apikey})
			expect(newConfig.trustedCommunities).to.deep.equal(trustedCommunities)
			expect(newConfig.guildid).to.deep.equal(previousConfig.guildid)
		})
	})
})