import CommunityManager from "../src/CommunityManager"
import { Community, ApiID } from "../src/types/apitypes"
import config from "./testconfig"
import ApiWrapper from "../src/index"

import { expect } from "chai"

const FAGC = new ApiWrapper(config.apikey)

const testGuildId = "749943992719769613"
const testUserId  = "429696038266208258"
const testStuff = {
	violation: {
		automated: false,
		description: "i like potatoes",
		proof: "not gonna give it to ya",
	}
}

describe("ApiWrapper", () => {
	it("Should be able to fetch rules and cache them", async () => {
		const rules = await FAGC.rules.fetchAll()
		const rule = FAGC.rules.resolveID(rules[0]?.id)
		expect(rules[0]?.id).to.equal(rule?.id, "Cached rules improperly")
	})
	it("Should be able to fetch communities and cache them", async () => {
		const communities = await FAGC.communities.fetchAll()
		const community = FAGC.communities.resolveID(communities[0]?.id)
		expect(communities[0]?.id).to.equal(community?.id, "Cached communities improperly")
	})
	it("Should be able to set and get configs properly", async () => {
		const oldConfig = await FAGC.communities.fetchConfig(testGuildId)
		expect(oldConfig?.guildId).to.equal(testGuildId, "Guild configs fetched improperly")
		const newName = "OOF2 BANBOT"
		const newConfig = await FAGC.communities.setConfig({
			communityname: newName
		})
		expect(newConfig.communityname).to.equal(newName, "Community config names were set improperly")

		// reset community name after test
		await FAGC.communities.setConfig({
			communityname: oldConfig.communityname
		})
	})
	it("Should be able to create a violation, cache it and revoke it", async () => {
		const playername = "Windsinger"
		const rules = await FAGC.rules.fetchAll()
		const violation = await FAGC.violations.create({
			playername: playername,
			brokenRule: rules[0].id,
			adminId: testUserId,
			description: testStuff.violation.description,
			automated: testStuff.violation.automated,
		})
		expect(violation.adminId).to.equal(testUserId, "Violation admin ID mismatch")
		expect(violation.playername).to.equal(playername, "Violation playername mismatch")
		expect(violation.brokenRule).to.equal(rules[0].id, "Violation rule mismatch")
		expect(violation.description).to.equal(testStuff.violation.description, "Violation description mismatch")
		expect(violation.automated).to.equal(testStuff.violation.automated, "Violation automated mismatch")
		expect(violation.proof).to.equal(testStuff.violation.proof, "Violation proof mismatch")

		const resolvedViolation = FAGC.violations.resolveID(violation.id)
		expect(resolvedViolation).to.deep.equal(violation, "Cached violation mismatch to violation")

		const revocation = await FAGC.violations.revoke(violation.id, testUserId)
		// equal violation
		expect(revocation.adminId).to.equal(violation.adminId, "Revocation adminId mismatch")
		expect(revocation.playername).to.equal(violation.playername, "Revocation playername mismatch")
		expect(revocation.brokenRule).to.equal(violation.brokenRule, "Revocation brokenRule mismatch")
		expect(revocation.description).to.equal(violation.description, "Revocation description mismatch")
		// revocation specific
		expect(revocation.revokedBy).to.equal(testUserId, "Revocation revokedBy mismatch")
		expect(revocation.violatedTime).to.equal(violation.violatedTime, "Revocation time mismatch")

		const resolvedViolationAfterRevoked = FAGC.violations.resolveID(violation.id)
		expect(resolvedViolation).to.equal(null, "Violation was cached after it was revoked")
	})
})