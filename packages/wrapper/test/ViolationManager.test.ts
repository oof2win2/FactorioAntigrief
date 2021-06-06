import config from "./testconfig"
import ApiWrapper from "../src/index"

import { expect } from "chai"

const FAGC = new ApiWrapper(config.apikey, {uncachems: config.uncachems, uncacheage: config.uncacheage})
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))


describe("ViolationManager", () => {
	const Violations = FAGC.violations
	let testViolationID
	let testRuleID
	const playername = "Windsinger"
	before(async () => {
		testRuleID = "XuciBx7" || await FAGC.rules.fetchAll().then(r=>r[0]?.id)
		FAGC.rules.cache.clear()
		await Violations.create({
			playername: playername,
			brokenRule: testRuleID,
			adminid: "429696038266208258"
		})
		testViolationID = await Violations.fetchAllName(playername).then(v=>v[0]?.id)
		FAGC.violations.cache.clear()
	})
	describe("#fetchViolations()", () => {
		beforeEach(() => {
			Violations.cache.clear()
		})
		it("Should fetch a violation correctly", async () => {
			const violations = await Violations.fetchAllName(playername)
			violations.forEach(violation => expect(violation.playername).to.deep.equal(playername))
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
	describe("#resolveID", () => {
		it("Should remove a violation from cache after a set amount of time", async function() {
			this.timeout(config.uncachems*4)
			await Violations.fetchViolation(testViolationID) // adds to cache
			await wait(config.uncachems*2) // wait double the time of the timeout to be sure it is wiped
			const resolved = Violations.resolveID(testViolationID)
			expect(resolved, "Cache still had the violation").to.equal(null)
		})
	})
	describe("#create()", () => {
		it("Should create a violation properly", async () => {
			const created = await Violations.create({
				playername: "Windsinger",
				brokenRule: testRuleID,
				adminid: "429696038266208258"
			})
			expect(created.brokenRule).to.equal(testRuleID, "Created rule ID didn't match supplied rule ID")
		})
		it("Should have the violation cached after it's creation", async () => {
			const created = await Violations.create({
				playername: "Windsinger",
				brokenRule: testRuleID,
				adminid: "429696038266208258"
			})
			const resolved = Violations.resolveID(created.id)
			expect(resolved?.id).to.equal(created.id, "Created violation wasn't cached properly")
		})
	})
	describe("#fetchByRule()", () => {
		it("Should fetch violations by rule", async () => {
			const violations = await Violations.fetchByRule(testRuleID)
			expect(violations[0]?.id, "Wasn't able to test as no violations with this rule exist")
			violations.forEach(violation => {
				expect(violation.brokenRule, "Violation's rule ID was not equal to the requested rule ID").to.equal(testRuleID)
			})
		})
		it("Should fetch violations by rule and cache them", async () => {
			const violations = await Violations.fetchByRule(testRuleID)
			const violation = Violations.resolveID(violations[0].id)
			expect(violation.id, "Violation was not cached").to.equal(violations[0].id)
		})
	})
	describe("#revoke()", () => {
		it("Should revoke a violation properly", async () => {
			const created = await Violations.create({
				playername: "Windsinger",
				brokenRule: testRuleID,
				adminid: "429696038266208258"
			})
			const revoked = await Violations.revoke(created.id, "429696038266208258")
			expect(revoked.violatedTime).to.equal(created.violatedTime, "Creation times do not equal therefore the violation is not the same")
		})
	})
	describe("#revokeAllName()", () => {
		it("Should revoke all violations from a name properly", async function ()  {
			this.timeout(5000*3)
			// create 5 violations
			const createAmount = 5
			await Promise.all(new Array(createAmount).fill(0).map(_ => {
				return Violations.create({
					playername: "Windsinger",
					brokenRule: testRuleID,
					adminid: "429696038266208258"
				})
			}))
			const violations = await Violations.fetchAllName("Windsinger")
			const revoked = await Violations.revokeAllName("Windsinger", "429696038266208258")
			expect(revoked.violations.length).to.equal(violations.length, "Amount of violations fetched and revoked did not match")
		})
	})
})