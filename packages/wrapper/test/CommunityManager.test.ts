import CommunityManager from "../src/CommunityManager"
import { Community, ApiID } from "../src/types"
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
			const timeBeforeFetch = performance.now()
			await Communities.fetchCommunity(testingID)
			const timeAfterFetch = performance.now()
			await Communities.fetchCommunity(testingID)
			const timeAfterCachedFetch = performance.now()
			expect((timeAfterFetch - timeBeforeFetch < timeAfterCachedFetch - timeAfterFetch), `Time to fetch after cached (${timeAfterCachedFetch - timeAfterFetch}ms) took longer than before cached (${timeAfterFetch - timeBeforeFetch}ms)`).to.equal(false)
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
			expect(fetched.length, "Did not fetch an array of communities").to.greaterThanOrEqual(1)
		})
		it("Should cache all fetched communities", async () => {
			const fetched = await Communities.fetchAll()
			expect(fetched.length, "Amount of cached communities was not equal to amount of fetched communities").to.equal(Communities.cache.size)
		})
	})
	describe("#resolveID()", () => {
		it("Should fetch if not cached", async () => {
			const community = await Communities.fetchCommunity(testingID)
			expect(community.id).to.equal(testingID)
		})
		it("Should resolve quickly if cached", async () => {
			const before = performance.now()
			const community = await Communities.fetchCommunity(testingID)
			const after = performance.now()
			expect(community.id).to.equal(testingID)
			expect(after - before, "Took more than 1ms to get supposedly cached result").to.be.lessThanOrEqual(1)
		})
	})
	describe("#fetchConfig()", () => {
		it("Should fetch a config correctly", async () => {
			const fetched = await Communities.fetchConfig(config.guildid)
			expect(fetched.guildid).to.equal(config.guildid)
		})
	})
})