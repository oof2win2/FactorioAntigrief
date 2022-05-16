import ReportInfoModel from "../../src/database/reportinfo"
import { createApikey } from "../../src/utils/authentication"
import "../mockDiscord"
import { testCategories, testCommunity } from "../utils/initialData"
import backend from "../../src/app"
import { createReport } from "../utils"

describe("POST /revocations", () => {
	it("Should turn a report into a revocation", async () => {
		const apikey = await createApikey(
			testCommunity,
			testCommunity,
			"reports"
		)
		const report = await ReportInfoModel.create(
			createReport({
				communityId: testCommunity.id,
				categoryId: testCategories[0].id,
			})
		)
		const response = await backend.inject({
			method: "POST",
			path: "/revocations",
			headers: {
				authorization: `Bearer ${apikey}`,
			},
			payload: {
				reportId: report.id,
				adminId: report.adminId,
			},
		})
		expect(response.statusCode).toBe(200)
		const json = response.json()
		expect(json.revokedBy).toBe(report.adminId)
		const reportsResponse = await backend.inject({
			method: "GET",
			path: "/reports",
		})
		expect(reportsResponse.statusCode).toBe(200)
		const reportsJson = reportsResponse.json()
		expect(reportsJson).toEqual([])
		expect(json.revokedBy).toBe(report.adminId)
		const reportResponse = await backend.inject({
			method: "GET",
			path: `/reports/${report.id}`,
		})
		expect(reportResponse.statusCode).toBe(200)
		const reportJson = reportResponse.json()
		expect(reportJson).toEqual(null)
	})
})
