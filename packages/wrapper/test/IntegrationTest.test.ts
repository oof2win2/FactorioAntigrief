import config from "./testconfig"
import { FAGCWrapper, RequestConfig } from "../src/index"
import { GuildConfig, Report, Revocation } from "fagc-api-types"

import { expect } from "chai"

import { step } from "mocha-steps"

const FAGC = new FAGCWrapper({
	apikey: config.apikey,
	socketurl: config.websocketurl,
	apiurl: config.apiurl,
	masterapikey: config.masterapikey,
})

const testGuildId = "749943992719769613"
const testUserId = "429696038266208258"
const testStuff = {
	report: {
		automated: false,
		description:
			"tortor posuere ac ut consequat semper viverra nam libero justo laoreet sit amet cursus sit amet dictum sit amet justo",
		proof: "tortor posuere ac ut consequat semper viverra nam libero justo laoreet sit amet cursus sit amet dictum sit amet justo",
		playername: "Windsinger",
	},
	reportCount: 5,
	webhookId: "865254241533820959",
	webhookToken:
		"m_ROP6uDvag5okV9YcrC9KkxBZ5sWgRDTCcnhrVdQGCi78W29-5jyflOsl1M6PFqoimn",
	rule: {
		shortdesc: "Some rule short description",
		longdesc: "Some rule long description",
	},
	community: {
		name: "Testing Community Alpha",
	},
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
		expect(communities[0]?.id).to.equal(
			community?.id,
			"Cached communities improperly"
		)
	})
	step("Should be able to fetch own community with API key", async () => {
		const ownCommunity = await FAGC.communities.fetchOwnCommunity(null, {
			apikey: config.apikey,
		})
		expect(ownCommunity, "Community was not found").to.not.be.null
	})
	step("Should be able to set and get configs properly", async function () {
		this.timeout(5000)
		const guildConfig = await FAGC.communities.fetchGuildConfig(testGuildId)
		const oldConfig = await FAGC.communities.fetchCommunityConfig(
			guildConfig.communityId
		)
		expect(oldConfig?.guildIds).to.include(
			testGuildId,
			"Guild configs fetched improperly"
		)
		const newName = "OOF2 BANBOT"
		const newConfig = await FAGC.communities.setCommunityConfig({
			name: newName,
		})
		expect(newConfig.name).to.equal(
			newName,
			"Community config names were set improperly"
		)

		// reset community name after test
		await FAGC.communities.setCommunityConfig({
			name: oldConfig.name,
		})
	})
	step(
		"Should be able to create a report, cache it, fetch it by community, and revoke it",
		async () => {
			const rules = await FAGC.rules.fetchAll()
			const report = await FAGC.reports.create({
				brokenRule: rules[0].id,
				adminId: testUserId,
				...testStuff.report, // description, automated, proof, playername
			})
			expect(report.adminId).to.equal(
				testUserId,
				"Report admin ID mismatch"
			)
			expect(report.playername).to.equal(
				testStuff.report.playername,
				"Report playername mismatch"
			)
			expect(report.brokenRule).to.equal(
				rules[0].id,
				"Report rule mismatch"
			)
			expect(report.description).to.equal(
				testStuff.report.description,
				"Report description mismatch"
			)
			expect(report.automated).to.equal(
				testStuff.report.automated,
				"Report automated mismatch"
			)
			expect(report.proof).to.equal(
				testStuff.report.proof,
				"Report proof mismatch"
			)

			const resolvedReport = FAGC.reports.resolveID(report.id)
			expect(resolvedReport).to.deep.equal(
				report,
				"Cached report mismatch to report"
			)

			const revocation = await FAGC.reports.revoke(report.id, testUserId)
			// equal report
			expect(revocation.adminId).to.equal(
				report.adminId,
				"Revocation adminId mismatch"
			)
			expect(revocation.playername).to.equal(
				report.playername,
				"Revocation playername mismatch"
			)
			expect(revocation.brokenRule).to.equal(
				report.brokenRule,
				"Revocation brokenRule mismatch"
			)
			expect(revocation.description).to.equal(
				report.description,
				"Revocation description mismatch"
			)
			expect(revocation.automated).to.equal(
				report.automated,
				"Revocation automated mismatch"
			)
			expect(revocation.proof).to.equal(
				report.proof,
				"Revocation proof mismatch"
			)
			expect(revocation.reportedTime.valueOf()).to.equal(
				report.reportedTime.valueOf(),
				"Revocation time mismatch"
			)
			// revocation specific
			expect(revocation.revokedBy).to.equal(
				testUserId,
				"Revocation revokedBy mismatch"
			)

			const resolvedReportsAfterRevoked = FAGC.reports.resolveID(
				report.id
			)
			expect(
				resolvedReportsAfterRevoked,
				"Report not removed from cache properly"
			).to.be.null
		}
	)
	step(
		"Should be able to create multiple reports, cache them and revoke them",
		async () => {
			const rules = await FAGC.rules.fetchAll()
			const createdReports = await Promise.all(
				new Array(testStuff.reportCount).fill(0).map(() => {
					return FAGC.reports.create({
						brokenRule: rules[0].id,
						adminId: testUserId,
						...testStuff.report, // description, automated, proof, playername
					})
				})
			)
			createdReports.forEach((report) => {
				// check that all reports were created correctly
				expect(report.adminId).to.equal(
					testUserId,
					"Report admin ID mismatch"
				)
				expect(report.playername).to.equal(
					testStuff.report.playername,
					"Report playername mismatch"
				)
				expect(report.brokenRule).to.equal(
					rules[0].id,
					"Report rule mismatch"
				)
				expect(report.description).to.equal(
					testStuff.report.description,
					"Report description mismatch"
				)
				expect(report.automated).to.equal(
					testStuff.report.automated,
					"Report automated mismatch"
				)
				expect(report.proof).to.equal(
					testStuff.report.proof,
					"Report proof mismatch"
				)

				// check resolved report
				const resolved = FAGC.reports.resolveID(report.id)
				expect(resolved).to.deep.equal(
					report,
					"Cached report mismatch to report"
				)
			})

			const reports = (
				await FAGC.reports.fetchAllName(testStuff.report.playername)
			).filter(
				(report) => report.communityId == createdReports[0].communityId
			)
			const revocations = await FAGC.reports.revokeAllName(
				testStuff.report.playername,
				testUserId
			)
			expect(revocations.length).to.equal(
				reports.length,
				"Amount of player reports and revocations mismatch"
			)
			revocations.forEach((revocation, i) => {
				const report = reports[i]
				// equal report
				expect(revocation.adminId).to.equal(
					report.adminId,
					"Revocation adminId mismatch"
				)
				expect(revocation.playername).to.equal(
					report.playername,
					"Revocation playername mismatch"
				)
				expect(revocation.brokenRule).to.equal(
					report.brokenRule,
					"Revocation brokenRule mismatch"
				)
				expect(revocation.description).to.equal(
					report.description,
					"Revocation description mismatch"
				)
				expect(revocation.automated).to.equal(
					report.automated,
					"Revocation automated mismatch"
				)
				expect(revocation.proof).to.equal(
					report.proof,
					"Revocation proof mismatch"
				)
				expect(revocation.reportedTime.valueOf()).to.equal(
					report.reportedTime.valueOf(),
					"Revocation time mismatch"
				)
				// revocation specific
				expect(revocation.revokedBy).to.equal(
					testUserId,
					"Revocation revokedBy mismatch"
				)
			})

			reports.forEach((report) => {
				// make sure that reports are removed from cache
				const resolved = FAGC.reports.resolveID(report.id)
				expect(resolved, "Report not removed from cache properly").to.be
					.null
			})
		}
	)
	step(
		"Should be able to create reports and get a profile from them",
		async () => {
			const rules = await FAGC.rules.fetchAll()
			const createdReports = await Promise.all(
				new Array(testStuff.reportCount).fill(0).map(() => {
					return FAGC.reports.create({
						brokenRule: rules[0].id,
						adminId: testUserId,
						...testStuff.report, // description, automated, proof, playername
					})
				})
			)
			const fetchedReports = (
				await FAGC.reports.fetchAllName(testStuff.report.playername)
			).filter(
				(report) => report.communityId == createdReports[0].communityId
			)
			const profile = await FAGC.profiles.fetchCommunity(
				testStuff.report.playername,
				fetchedReports[0].communityId
			)
			expect(profile.reports.length).to.equal(
				fetchedReports.length,
				"Amount of fetched reports and reports in profile did not match"
			)
			expect(fetchedReports).to.deep.equal(
				profile.reports,
				"Fetched reports did not match reports in profile"
			)
			expect(profile.playername).to.equal(
				testStuff.report.playername,
				"Given playername and profile playername mismatch"
			)
			expect(profile.communityId).to.equal(
				fetchedReports[0].communityId,
				"Community IDs mismatch"
			)
		}
	)
	step("Addition and removal of webhooks should work", async () => {
		// this should probably be in a before() hook but that apparently doesnt work here
		await FAGC.info.removeWebhook(
			testStuff.webhookId,
			testStuff.webhookToken
		)

		const added = await FAGC.info.addWebhook(
			testStuff.webhookId,
			testStuff.webhookToken
		)
		expect(added.id).to.equal(
			testStuff.webhookId,
			"Webhook Creation IDs mismatch"
		)
		expect(added.token).to.equal(
			testStuff.webhookToken,
			"Webhook Creation token mismatch"
		)
		expect(added.guildId).to.equal(
			testGuildId,
			"Webhook Creation guild IDs mismatch"
		)

		const removed = await FAGC.info.removeWebhook(
			testStuff.webhookId,
			testStuff.webhookToken
		)
		expect(removed.id).to.equal(
			testStuff.webhookId,
			"Webhook Removal IDs mismatch"
		)
		expect(removed.token).to.equal(
			testStuff.webhookToken,
			"Webhook Removal token mismatch"
		)
		expect(removed.guildId).to.equal(
			testGuildId,
			"Webhook Removal guild IDs mismatch"
		)
	})
	// step("Report WebSocket event should work", async () => {
	// 	// before(async () => await FAGC.reports.revokeAllName(testStuff.report.playername, testUserId).catch())
	// 	// after(async () => await FAGC.reports.revokeAllName(testStuff.report.playername, testUserId).catch())

	// 	const rules = await FAGC.rules.fetchAll()
	// 	const ReportHandler = (evt: Report) => {
	// 		// expect(evt.id).to.equal(report.id, "Event Report ID mismatch")
	// 		expect(evt.adminId).to.equal(testUserId, "Event Report admin ID mismatch")
	// 		expect(evt.playername).to.equal(testStuff.report.playername, "Event Report playername mismatch")
	// 		expect(evt.brokenRule).to.equal(rules[0].id, "Event Report rule mismatch")
	// 		expect(evt.description).to.equal(testStuff.report.description, "Event Report description mismatch")
	// 		expect(evt.automated).to.equal(testStuff.report.automated, "Event Report automated mismatch")
	// 		expect(evt.proof).to.equal(testStuff.report.proof, "Event Report proof mismatch")
	// 	}
	// 	const RevocationHandler = (evt: Revocation) => {
	// 		// report stuff
	// 		// expect(evt.id).to.equal(revocation.id, "Event Revocation ID mismatch")
	// 		expect(evt.adminId).to.equal(testUserId, "Event Revocation admin ID mismatch")
	// 		expect(evt.playername).to.equal(testStuff.report.playername, "Event Revocation playername mismatch")
	// 		expect(evt.brokenRule).to.equal(rules[0].id, "Event Revocation rule mismatch")
	// 		expect(evt.description).to.equal(testStuff.report.description, "Event Revocation description mismatch")
	// 		expect(evt.automated).to.equal(testStuff.report.automated, "Event Revocation automated mismatch")
	// 		expect(evt.proof).to.equal(testStuff.report.proof, "Event Revocation proof mismatch")

	// 		// revocation stuff
	// 		// expect(evt.revokedBy).to.equal(revocation.revokedBy, "Event Revocation revokedBy mismatch")
	// 		// expect(evt.revokedTime).to.equal(revocation.revokedTime, "Event Revocation revokedTime mismatch")
	// 	}
	// 	FAGC.websocket.once("report", ReportHandler)
	// 	FAGC.websocket.once("revocation", RevocationHandler)
	// 	const report = await FAGC.reports.create({
	// 		brokenRule: rules[0].id,
	// 		adminId: testUserId,
	// 		...testStuff.report, // description, automated, proof, playername
	// 	})
	// 	const revocation = await FAGC.reports.revoke(report.id, testUserId)
	// })
	// test doesn't work so don't run it
	// step("Getting Guild Config from websocket should work", async () => {
	// 	const CommunityConfigChangeHandler = (config: CommunityConfig) => {
	// 		expect(config.guildId).to.equal(testGuildId, "API sent the wrong guild ID")
	// 	}
	// 	FAGC.websocket.once("guildConfig", CommunityConfigChangeHandler)
	// 	FAGC.websocket.setGuildID(testGuildId)
	// })
	step("Should be able to add and remove rules", async () => {
		const rule = await FAGC.rules.create(testStuff.rule)
		expect(rule.shortdesc).to.equal(
			testStuff.rule.shortdesc,
			"Created rule shortdesc did not match input"
		)
		expect(rule.longdesc).to.equal(
			testStuff.rule.longdesc,
			"Created rule longdesc did not match input"
		)

		const resolvedRule = FAGC.rules.resolveID(rule.id)
		expect(resolvedRule.id).to.equal(
			rule.id,
			"Resolved rule id did not match created"
		)
		expect(resolvedRule.shortdesc).to.equal(
			rule.shortdesc,
			"Resolved rule shortdesc did not match created"
		)
		expect(resolvedRule.longdesc).to.equal(
			rule.longdesc,
			"Resolved rule longdesc did not match created"
		)

		const fetchedRule = await FAGC.rules.fetchRule(rule.id, true, true)
		expect(fetchedRule.id).to.equal(
			rule.id,
			"Fetched rule id did not match created"
		)
		expect(fetchedRule.shortdesc).to.equal(
			rule.shortdesc,
			"Fetched rule shortdesc did not match created"
		)
		expect(fetchedRule.longdesc).to.equal(
			rule.longdesc,
			"Fetched rule longdesc did not match created"
		)

		const removedRule = await FAGC.rules.remove(rule.id)
		expect(removedRule.id).to.equal(
			rule.id,
			"Removed rule id did not match created"
		)
		expect(removedRule.shortdesc).to.equal(
			rule.shortdesc,
			"Removed rule shortdesc did not match created"
		)
		expect(removedRule.longdesc).to.equal(
			rule.longdesc,
			"Removed rule longdesc did not match created"
		)

		const resolvedAfterRemove = FAGC.rules.resolveID(rule.id)
		expect(resolvedAfterRemove, "Resolved rule was not null").to.be.null

		const fetchedAfterRemove = await FAGC.rules.fetchRule(rule.id)
		expect(fetchedAfterRemove, "Fetched rule was not null").to.be.null
	})
	step(
		"Should be able to create and remove a community with violations and revocations getting removed",
		async function () {
			this.timeout(5000)
			const communityResult = await FAGC.communities.create(
				testStuff.community.name,
				testUserId,
				"548410604679856151"
			)
			const community = communityResult.community
			expect(community.name).to.equal(
				testStuff.community.name,
				"Community name mismatch"
			)
			expect(community.contact).to.equal(
				testUserId,
				"Community contact mismatch"
			)
			expect(community.guildIds).to.include(
				"548410604679856151",
				"Community guildId mismatch"
			)

			const requestConfig: RequestConfig = {
				apikey: communityResult.apiKey,
			}
			const rules = await FAGC.rules.fetchAll()
			const report = await FAGC.reports.create(
				{
					brokenRule: rules[0].id,
					adminId: testUserId,
					...testStuff.report, // description, automated, proof, playername
				},
				true,
				requestConfig
			)
			expect(report.communityId).to.equal(
				community.id,
				"Report communityId mismatch"
			)
			const report2 = await FAGC.reports.create(
				{
					brokenRule: rules[0].id,
					adminId: testUserId,
					...testStuff.report, // description, automated, proof, playername
				},
				true,
				requestConfig
			)
			const revocation = await FAGC.reports.revoke(
				report2.id,
				testUserId,
				true,
				requestConfig
			)
			expect(revocation.communityId).to.equal(
				community.id,
				"Revocation communityId mismatch"
			)

			await FAGC.communities.remove(community.id)

			const fetchedCommunity = await FAGC.communities.fetchCommunity(
				community.id,
				null,
				true
			)
			expect(fetchedCommunity, "Community exists after it was removed").to
				.be.null

			const fetchedReport = await FAGC.reports.fetchReport(
				report.id,
				null,
				true
			)
			expect(fetchedReport, "Report exists after community was removed")
				.to.be.null

			const fetchedRevocation = await FAGC.revocations.fetchRevocations(
				testStuff.report.playername,
				community.id,
				true
			)
			expect(fetchedRevocation.length).to.equal(
				0,
				"Revocations exist after community was removed"
			)
		}
	)
	step("Should be able to fetch reports by timestamp", async () => {
		const rules = await FAGC.rules.fetchAll()

		const reportTimeBefore = new Date()

		const createdReports = await Promise.all(
			new Array(testStuff.reportCount).fill(0).map(() => {
				return FAGC.reports.create({
					brokenRule: rules[0].id,
					adminId: testUserId,
					...testStuff.report, // description, automated, proof, playername
				})
			})
		)

		const reportsFetchedBefore = await FAGC.reports.fetchModifiedSince(
			reportTimeBefore
		)
		expect(createdReports.length).to.be.lessThanOrEqual(
			reportsFetchedBefore.length,
			"Number of reports before is smaller than the number of created reports"
		)
		const reportTimeAfter = new Date(Date.now() + 1000 * 10)
		const reportsFetchedAfter = await FAGC.reports.fetchModifiedSince(
			reportTimeAfter
		)
		expect(reportsFetchedAfter.length).to.be.equal(
			0,
			"Reports were created in the future"
		)

		const revocationTimeBefore = new Date()
		const revocations = await Promise.all(
			createdReports.map((report) =>
				FAGC.reports.revoke(report.id, testUserId)
			)
		)
		const revocationsFetchedBefore =
			await FAGC.revocations.fetchModifiedSince(revocationTimeBefore)
		expect(revocations.length).to.be.lessThanOrEqual(
			revocationsFetchedBefore.length,
			"Number of revocations before is smaller than the number of created revocations"
		)
		const revocationTimeAfter = new Date(Date.now() + 1000 * 10)
		const revocationsFetchedAfter =
			await FAGC.revocations.fetchModifiedSince(revocationTimeAfter)
		expect(revocationsFetchedAfter.length).to.be.equal(
			0,
			"Revocations were created in the future"
		)
	})
})
