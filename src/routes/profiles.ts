import { DocumentType } from "@typegoose/typegoose"
import express from "express"
import ReportModel, { ReportClass } from "../database/fagc/report"
import { validateUserString } from "../utils/functions-databaseless"

const router = express.Router()

/* GET home page. */
router.get("/", function (req, res) {
	res.json({ message: "Profiles API Homepage!" })
})

router.get("/getcommunity", async (req, res) => {
	if (!req.query.playername || typeof(req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}` })
	if (req.query.communityId === undefined || typeof (req.query.communityId) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `communityId expected string, got ${typeof (req.query.communityId)} with value of ${req.query.communityId}` })
	if (!validateUserString(req.query.communityId))
		return res.status(400).json({ error: "Bad Request", description: `communityId is not correct ID, got value of ${req.query.communityId}` })
	const allReports = await ReportModel.find({playername: req.query.playername}).then(reports=>reports.map(r=>r.toObject()))
	if (!allReports || !allReports[0]?.id) return res.status(200).json(allReports)
	const profile = {
		communityId: req.query.communityId,
		playername: req.query.playername,
		reports: allReports
	}
	res.status(200).json(profile)
})
router.get("/getall", async (req, res) => {
	if (!req.query.playername || typeof(req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}` })
	const allReports = await ReportModel.find({playername: req.query.playername})
	const profilesMap = new Map<string, {
		playername: string
		communityId: string,
		reports: DocumentType<ReportClass>[]
	}>()
	allReports.forEach((report: DocumentType<ReportClass>) => {
		let profile = profilesMap.get(report.communityId)
		if (profile) {
			profile.reports.push(report)
			profilesMap.set(report.communityId, profile)
		} else {
			profilesMap.set(report.communityId, {
				playername: report.playername,
				communityId: report.communityId,
				reports: [report]
			})
		}
	})
	const profiles: { playername: string, communityId: string, reports: DocumentType<ReportClass>[] }[] = []
	profilesMap.forEach((profile) => profiles.push(profile))
	res.status(200).json(profiles)
})

export default router