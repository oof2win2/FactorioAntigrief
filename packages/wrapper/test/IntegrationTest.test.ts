import config from "./testconfig"
import { FAGCWrapper } from "../src/index"
import { CommunityConfig, Report, Revocation } from "fagc-api-types"

import { expect } from "chai"

import { step } from "mocha-steps"

const FAGC = new FAGCWrapper({
	apikey: config.apikey,
	socketurl: config.websocketurl,
	apiurl: config.apiurl,

})

const testGuildId = "749943992719769613"
const testUserId = "429696038266208258"
const testStuff = {
	report: {
		automated: false,
		description: "i like potatoes",
		proof: "not gonna give it to ya",
		playername: "Windsinger",
	},
	reportCount: 5,
	webhookId: "865254241533820959",
	webhookToken: "m_ROP6uDvag5okV9YcrC9KkxBZ5sWgRDTCcnhrVdQGCi78W29-5jyflOsl1M6PFqoimn"
}

describe("ApiWrapper", () => {
	beforeEach(() => {
		// clear all caches
		FAGC.communities.cache.clear()
		FAGC.reports.cache.clear()
		FAGC.revocations.cache.clear()
		FAGC.rules.cache.clear()
	})
	step("Should be able to fetch rules and cache them", async () => {
		const rules = await FAGC.rules.fetchAll()
		const rule = FAGC.rules.resolveID(rules[0]?.id)
		expect(rules[0]?.id).to.equal(rule?.id, "Cached rules improperly")
	})
	step("Should be able to fetch communities and cache them", async () => {
		const communities = await FAGC.communities.fetchAll()
		const community = FAGC.communities.resolveID(communities[0]?.id)
		expect(communities[0]?.id).to.equal(community?.id, "Cached communities improperly")
	})
	step("Should be able to set and get configs properly", async function() {
		this.timeout(5000)
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
	step("Should be able to create a report, cache it, fetch it by community, and revoke it", async () => {
		const rules = await FAGC.rules.fetchAll()
		const report = await FAGC.reports.create({
			brokenRule: rules[0].id,
			adminId: testUserId,
			...testStuff.report, // description, automated, proof, playername
		})
		expect(report.adminId).to.equal(testUserId, "Report admin ID mismatch")
		expect(report.playername).to.equal(testStuff.report.playername, "Report playername mismatch")
		expect(report.brokenRule).to.equal(rules[0].id, "Report rule mismatch")
		expect(report.description).to.equal(testStuff.report.description, "Report description mismatch")
		expect(report.automated).to.equal(testStuff.report.automated, "Report automated mismatch")
		expect(report.proof).to.equal(testStuff.report.proof, "Report proof mismatch")

		const resolvedReport = FAGC.reports.resolveID(report.id)
		expect(resolvedReport).to.deep.equal(report, "Cached report mismatch to report")

		const revocation = await FAGC.reports.revoke(report.id, testUserId)
		// equal report
		expect(revocation.adminId).to.equal(report.adminId, "Revocation adminId mismatch")
		expect(revocation.playername).to.equal(report.playername, "Revocation playername mismatch")
		expect(revocation.brokenRule).to.equal(report.brokenRule, "Revocation brokenRule mismatch")
		expect(revocation.description).to.equal(report.description, "Revocation description mismatch")
		expect(revocation.automated).to.equal(report.automated, "Revocation automated mismatch")
		expect(revocation.proof).to.equal(report.proof, "Revocation proof mismatch")
		expect(revocation.reportedTime.valueOf()).to.equal(report.reportedTime.valueOf(), "Revocation time mismatch")
		// revocation specific
		expect(revocation.revokedBy).to.equal(testUserId, "Revocation revokedBy mismatch")

		const resolvedReportsAfterRevoked = FAGC.reports.resolveID(report.id)
		expect(resolvedReportsAfterRevoked, "Report not removed from cache properly").to.be.null
	})
	step("Should be able to create multiple reports, cache them and revoke them", async () => {
		const rules = await FAGC.rules.fetchAll()
		const createdReports = await Promise.all(new Array(testStuff.reportCount).fill(0).map(() => {
			return FAGC.reports.create({
				brokenRule: rules[0].id,
				adminId: testUserId,
				...testStuff.report, // description, automated, proof, playername
			})
		}))
		createdReports.forEach(report => {
			// check that all reports were created correctly
			expect(report.adminId).to.equal(testUserId, "Report admin ID mismatch")
			expect(report.playername).to.equal(testStuff.report.playername, "Report playername mismatch")
			expect(report.brokenRule).to.equal(rules[0].id, "Report rule mismatch")
			expect(report.description).to.equal(testStuff.report.description, "Report description mismatch")
			expect(report.automated).to.equal(testStuff.report.automated, "Report automated mismatch")
			expect(report.proof).to.equal(testStuff.report.proof, "Report proof mismatch")

			// check resolved report
			const resolved = FAGC.reports.resolveID(report.id)
			expect(resolved).to.deep.equal(report, "Cached report mismatch to report")
		})

		const reports = await FAGC.reports.fetchAllName(testStuff.report.playername)
		const revocations = await FAGC.reports.revokeAllName(testStuff.report.playername, testUserId)
		expect(revocations.length).to.equal(reports.length, "Amount of player reports and revocations mismatch")
		revocations.forEach((revocation, i) => {
			const report = reports[i]
			// equal report
			expect(revocation.adminId).to.equal(report.adminId, "Revocation adminId mismatch")
			expect(revocation.playername).to.equal(report.playername, "Revocation playername mismatch")
			expect(revocation.brokenRule).to.equal(report.brokenRule, "Revocation brokenRule mismatch")
			expect(revocation.description).to.equal(report.description, "Revocation description mismatch")
			expect(revocation.automated).to.equal(report.automated, "Revocation automated mismatch")
			expect(revocation.proof).to.equal(report.proof, "Revocation proof mismatch")
			expect(revocation.reportedTime.valueOf()).to.equal(report.reportedTime.valueOf(), "Revocation time mismatch")
			// revocation specific
			expect(revocation.revokedBy).to.equal(testUserId, "Revocation revokedBy mismatch")
		})

		reports.forEach(report => {
			// make sure that reports are removed from cache
			const resolved = FAGC.reports.resolveID(report.id)
			expect(resolved, "Report not removed from cache properly").to.be.null
		})
	})
	step("Should be able to create reports and get a profile from them", async () => {
		before(async () => await FAGC.reports.revokeAllName(testStuff.report.playername, testUserId))
		after(async () => await FAGC.reports.revokeAllName(testStuff.report.playername, testUserId))

		const rules = await FAGC.rules.fetchAll()
		await Promise.all(new Array(testStuff.reportCount).fill(0).map(() => {
			return FAGC.reports.create({
				brokenRule: rules[0].id,
				adminId: testUserId,
				...testStuff.report, // description, automated, proof, playername
			})
		}))
		const fetchedReports = await FAGC.reports.fetchAllName(testStuff.report.playername)
		const profile = await FAGC.profiles.fetchCommunity(testStuff.report.playername, fetchedReports[0].communityId)
		expect(profile.reports.length).to.equal(fetchedReports.length, "Amount of fetched reports and reports in profile did not match")
		expect(fetchedReports).to.deep.equal(profile.reports, "Fetched reports did not match reports in profile")
		expect(profile.playername).to.equal(testStuff.report.playername, "Given playername and profile playername mismatch")
		expect(profile.communityId).to.equal(fetchedReports[0].communityId, "Community IDs mismatch")
	})
	step("Addition and removal of webhooks should work", async () => {
		// this should probably be in a before() hook but that apparently doesnt work here
		await FAGC.info.removeWebhook(testStuff.webhookId, testStuff.webhookToken)

		const added = await FAGC.info.addWebhook(testStuff.webhookId, testStuff.webhookToken)
		expect(added.id).to.equal(testStuff.webhookId, "Webhook Creation IDs mismatch")
		expect(added.token).to.equal(testStuff.webhookToken, "Webhook Creation token mismatch")
		expect(added.guildId).to.equal(testGuildId, "Webhook Creation guild IDs mismatch")

		const removed = await FAGC.info.removeWebhook(testStuff.webhookId, testStuff.webhookToken)
		expect(removed.id).to.equal(testStuff.webhookId, "Webhook Removal IDs mismatch")
		expect(removed.token).to.equal(testStuff.webhookToken, "Webhook Removal token mismatch")
		expect(removed.guildId).to.equal(testGuildId, "Webhook Removal guild IDs mismatch")
	})
	step("Report WebSocket event should work", async () => {
		// before(async () => await FAGC.reports.revokeAllName(testStuff.report.playername, testUserId).catch())
		// after(async () => await FAGC.reports.revokeAllName(testStuff.report.playername, testUserId).catch())


		const rules = await FAGC.rules.fetchAll()
		const ReportHandler = (evt: Report) => {
			// expect(evt.id).to.equal(report.id, "Event Report ID mismatch")
			expect(evt.adminId).to.equal(testUserId, "Event Report admin ID mismatch")
			expect(evt.playername).to.equal(testStuff.report.playername, "Event Report playername mismatch")
			expect(evt.brokenRule).to.equal(rules[0].id, "Event Report rule mismatch")
			expect(evt.description).to.equal(testStuff.report.description, "Event Report description mismatch")
			expect(evt.automated).to.equal(testStuff.report.automated, "Event Report automated mismatch")
			expect(evt.proof).to.equal(testStuff.report.proof, "Event Report proof mismatch")
		}
		const RevocationHandler = (evt: Revocation) => {
			// report stuff
			// expect(evt.id).to.equal(revocation.id, "Event Revocation ID mismatch")
			expect(evt.adminId).to.equal(testUserId, "Event Revocation admin ID mismatch")
			expect(evt.playername).to.equal(testStuff.report.playername, "Event Revocation playername mismatch")
			expect(evt.brokenRule).to.equal(rules[0].id, "Event Revocation rule mismatch")
			expect(evt.description).to.equal(testStuff.report.description, "Event Revocation description mismatch")
			expect(evt.automated).to.equal(testStuff.report.automated, "Event Revocation automated mismatch")
			expect(evt.proof).to.equal(testStuff.report.proof, "Event Revocation proof mismatch")

			// revocation stuff
			// expect(evt.revokedBy).to.equal(revocation.revokedBy, "Event Revocation revokedBy mismatch")
			// expect(evt.revokedTime).to.equal(revocation.revokedTime, "Event Revocation revokedTime mismatch")
		}
		FAGC.websocket.once("report", ReportHandler)
		FAGC.websocket.once("revocation", RevocationHandler)
		const report = await FAGC.reports.create({
			brokenRule: rules[0].id,
			adminId: testUserId,
			...testStuff.report, // description, automated, proof, playername
		})
		const revocation = await FAGC.reports.revoke(report.id, testUserId)
	})
	step("Getting Guild Config from websocket should work", async () => {
		const CommunityConfigChangeHandler = (config: CommunityConfig) => {
			expect(config.guildId).to.equal(testGuildId, "API sent the wrong guild ID")
		}
		FAGC.websocket.once("guildConfig", CommunityConfigChangeHandler)
		FAGC.websocket.setGuildID(testGuildId)
	})
})