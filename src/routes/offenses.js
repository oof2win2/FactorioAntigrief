const express = require("express")
const router = express.Router()
const OffenseModel = require("../database/fagc/offense")
const { validateUserString } = require("../utils/functions-databaseless")


/* GET home page. */
router.get("/", function (req, res) {
	res.json({message:"Offenses API Homepage!"})
})
router.get("/getcommunity", async (req, res) => {
	if (req.query.playername === undefined || typeof (req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}`})
	if (req.query.communityid === undefined || typeof (req.query.communityid) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `communityid expected string, got ${typeof (req.query.communityid)} with value of ${req.query.communityid}`})
	if (!validateUserString(req.query.communityid))
		return res.status(400).json({ error: "Bad Request", description: `communityid is not correct ID, got value of ${req.query.communityid}` })
    
	const offense = await OffenseModel.findOne({
		playername: req.query.playername,
		communityid: req.query.communityid,
	}).populate("violations")
	res.status(200).json(offense)
})
router.get("/getall", async (req, res) => {
	if (req.query.playername === undefined || typeof (req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}` })
	const offense = await OffenseModel.find({
		playername: req.query.playername,
	}).populate("violations")
	res.status(200).json(offense)
})
router.get("/getbyid", async (req, res) => {
	if (req.query.id === undefined || typeof (req.query.id) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `id expected string, got ${typeof (req.query.id)} with value of ${req.query.id}`})
	if (!validateUserString(req.query.id))
		return res.status(400).json({ error: "Bad Request", description: `id is not correct ID, got value of ${req.query.id}`})
	
	const offense = await OffenseModel.findOne({ id: req.query.id }).populate("violations")
	res.status(200).json(offense)
})

module.exports = router