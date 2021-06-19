const express = require("express")
const router = express.Router()
const ViolationModel = require("../database/fagc/violation")
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
    const allViolations = await ViolationModel.find({playername: req.query.playername}).then(violations=>violations.map(v=>v.toObject()))
    if (!allViolations || !allViolations[0]?.id) return res.status(200).json(allViolations)
    const offense = {
        communityId: req.query.communityId,
        playername: req.query.playername,
        violations: allViolations
    }
    res.status(200).json(offense)
})
router.get("/getall", async (req, res) => {
    if (!req.query.playername || typeof(req.query.playername) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}` })
    const allViolations = await ViolationModel.find({playername: req.query.playername}).then(violations=>violations.map(v=>v.toObject()))
    const offensesMap = new Map()
    allViolations.forEach(violation => {
        let offense = offensesMap.get(violation.communityId)
        if (offense) {
            offense.violations.push(violation)
            offensesMap.set(violation.communityId, offense)
        } else {
            offensesMap.set(violation.communityId, {
                playername: violation.playername,
                communityId: violation.communityId,
                violations: [violation]
            })
        }
    })
    const offenses = []
    offensesMap.forEach(offense => offenses.push(offense))
    res.status(200).json(offenses)
})

module.exports = router