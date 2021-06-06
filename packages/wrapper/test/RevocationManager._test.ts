import config from "./testconfig"
import ApiWrapper from "../src/index"

import { expect } from "chai"

const FAGC = new ApiWrapper(config.apikey, {uncachems: config.uncachems, uncacheage: config.uncacheage})
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))


describe("RevocationManager", () => {
	const Revocations = FAGC.revocations
	let testRuleID
	const playername = "Windsinger"
	before(async () => {
		testRuleID = "XuciBx7" || await FAGC.rules.fetchAll().then(r=>r[0]?.id)
		FAGC.rules.cache.clear()
	})
	describe("#fetchRevocations", () => {
		it("Should fetch all revocations of a player", async () => {
			const createAmount = 5
			await Promise.all(new Array(createAmount).fill(0).map(_ => {
				return FAGC.violations.create({
					playername: playername,
					brokenRule: testRuleID,
					adminId: "429696038266208258"
				})
			}))
			await FAGC.violations.revokeAllName(playername, "429696038266208258")
			const revocations = await Revocations.fetchAllRevocations("Windsinger")
			revocations.forEach(revocation => {
				expect(revocation.playername).to.equal(playername, "Playernames don't match")
				expect(revocation.brokenRule).to.equal(testRuleID, "Broken rules don't match")
			})
			// this cannot be done as old revocations can't be removed
			// expect(revocations.length).to.equal(createAmount, "Amount of revocations did not equal amount of violations")
		})
	})
})