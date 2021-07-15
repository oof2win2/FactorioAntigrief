import express from "express"
import RevocationModel from "../database/fagc/revocation"
import { validateUserString } from "../utils/functions-databaseless"

const router = express.Router()

router.get("/getrevocations", async (req, res) => {
	if (req.query.playername === undefined || typeof (req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
	if (req.query.communityId === undefined || typeof (req.query.communityId) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `communityId expected string, got ${typeof (req.body.communityId)} with value of ${req.body.communityId}`})
	if (!validateUserString(req.query.communityId))
		return res.status(400).json({ error: "Bad Request", description: `communityId is not correct ID, got value of ${req.query.communityId}` })
	let revocations = await RevocationModel.find({
		playername: req.query.playername,
		communityId: req.query.communityId
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