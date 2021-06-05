import CommunityManager from "../src/CommunityManager"
import { Community, ApiID } from "../src/types/apitypes"
import config from "./testconfig"
import ApiWrapper from "../src/index"

import { expect } from 'chai';

const FAGC = new ApiWrapper(config.apikey, {uncachems: config.uncachems, uncacheage: config.uncacheage})
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))


describe("ViolationManager", () => {
	const Violations = FAGC.violations
	let testViolationID
	let testRuleID
	const playername = "Windsinger"
	before(async () => {
		testRuleID = await FAGC.rules.fetchAll().then(r=>r[0]?.id)
		FAGC.rules.cache.clear()
	})
	describe("#fetchViolations()", () => {
		beforeEach(() => {
			Violations.cache.clear()
		})
		it("Should fetch a violation correctly", async () => {
			const violations = await Violations.fetchAllName(playername)
			violations.forEach(violation => expect(violation.playername).to.deep.equal(playername))
			testViolationID = violations[0]?.id
		})
		it("Should fetch a violation correctly and then cache it", async () => {
			const beforeFetch = performance.now()
			await Violations.fetchViolation(testViolationID)
			const afterFetch = performance.now()
			await Violations.fetchViolation(testViolationID)
			const afterCached = performance.now()
			expect((afterCached - afterFetch), `Time to fetch after cached (${afterCached - afterFetch}ms) took longer than before cached (${afterFetch - beforeFetch}ms)`).lessThan(afterFetch - beforeFetch)
			expect(afterCached - afterFetch, "Took more than 1ms to get supposedly cached result").to.be.lessThanOrEqual(1)
		})
	})
	describe("#resolveID", async () => {
		it("Should remove a violation from cache after a set amount of time", async function() {
			this.timeout(config.uncachems*2+50)
			await Violations.fetchViolation(testViolationID) // adds to cache
			await wait(config.uncachems*2) // wait double the time of the timeout to be sure it is wiped
			const resolved = Violations.resolveID(testViolationID)
			expect(resolved, "Cache still had the violation").to.equal(null)
		})
	})
})