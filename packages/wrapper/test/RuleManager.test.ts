import CommunityManager from "../src/CommunityManager"
import { Community, ApiID } from "../src/types/apitypes"
import config from "./testconfig"
import ApiWrapper from "../src/index"

import { expect } from 'chai';

const FAGC = new ApiWrapper(config.apikey)


describe("RuleManager", () => {
	const Rules = FAGC.rules
	let testRuleID
	before(async () => {
		testRuleID = await Rules.fetchAll().then(r=>r[0]?.id)
		Rules.cache.clear()
	})
	describe("#fetchRule()", () => {
		beforeEach(() => {
			Rules.cache.clear()
		})
		it("Should fetch a rule correctly", async () => {
			const rule = await Rules.fetchRule(testRuleID)
			expect(rule.id).to.deep.equal(testRuleID)
		})
		it("Should fetch a rule correctly and then cache it", async () => {
			const beforeFetch = performance.now()
			await Rules.fetchRule(testRuleID)
			const afterFetch = performance.now()
			await Rules.fetchRule(testRuleID)
			const afterCached = performance.now()
			expect((afterFetch - beforeFetch < afterCached - afterFetch), `Time to fetch after cached (${afterCached - afterFetch}ms) took longer than before cached (${afterFetch - beforeFetch}ms)`).to.equal(false)
			expect(afterCached - afterFetch, "Took more than 1ms to get supposedly cached result").to.be.lessThanOrEqual(1)
		})
	})
	describe("#fetchAll()", () => {
		beforeEach(() => {
			Rules.cache.clear() // clear community cache
		})
		it("Should fetch all rules", async () => {
			const fetched = await Rules.fetchAll()
			if (fetched[0])
				expect(fetched[0].id).to.not.equal(null)
		})
		it("Should fetch all rules and cache them properly", async () => {
			const fetched = await Rules.fetchAll()
			expect(fetched.length, "Amount of cached rules was not equal to amount of fetched rules").to.equal(Rules.cache.size)
		})
	})
	describe("#resolveID()", () => {
		it("Should fetch if not cached", async () => {
			const fetched = await Rules.fetchRule(testRuleID)
			const resolved = Rules.resolveID(testRuleID)
			expect(resolved, "Resolved and fetched should be the same").deep.equal(fetched)
			expect(resolved.id).to.equal(testRuleID)
		})	
	})
})