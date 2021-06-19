const express = require("express")
const router = express.Router()
const ReportModel = require("../database/fagc/report")
const { validateUserString } = require("../utils/functions-databaseless")

/* GET home page. */
router.get("/", function (req, res) {
	res.json({ message: "Offenses API Homepage!" })
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
    const offense = {
        communityId: req.query.communityId,
        playername: req.query.playername,
        reports: allReports
    }
    res.status(200).json(offense)
})
router.get("/getall", async (req, res) => {
    if (!req.query.playername || typeof(req.query.playername) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}` })
    const allReports = await ReportModel.find({playername: req.query.playername}).then(reports=>reports.map(r=>r.toObject()))
    const offensesMap = new Map()
    allReports.forEach(report => {
        let offense = offensesMap.get(report.communityId)
        if (offense) {
            offense.reports.push(report)
            offensesMap.set(report.communityId, offense)
        } else {
            offensesMap.set(report.communityId, {
                playername: report.playername,
                communityId: report.communityId,
                reports: [report]
            })
        }
    })
    const offenses = []
    offensesMap.forEach(offense => offenses.push(offense))
    res.status(200).json(offenses)
})

module.exports = router