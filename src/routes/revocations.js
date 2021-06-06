const express = require("express")
const router = express.Router()
const RevocationModel = require("../database/fagc/revocation")
const { validateUserString } = require("../utils/functions-databaseless")

router.get("/getrevocations", async (req, res) => {
	if (req.query.playername === undefined || typeof (req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
	if (req.query.communityid === undefined || typeof (req.query.communityid) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `communityid expected string, got ${typeof (req.body.communityid)} with value of ${req.body.communityid}`})
	if (!validateUserString(req.query.communityid))
		return res.status(400).json({ error: "Bad Request", description: `communityid is not correct ID, got value of ${req.query.communityid}` })
	let revocations = await RevocationModel.find({
		playername: req.query.playername,
		communityid: req.query.communityid
	})
	return res.status(200).json(revocations)
})
router.get("/getallrevocations", async (req, res) => {
	if (req.query.playername === undefined || typeof (req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
	let revocations = await RevocationModel.find({
		playername: req.query.playername
	})
	return res.status(200).json(revocations)
})
module.exports = router