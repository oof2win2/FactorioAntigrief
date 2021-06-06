const express = require("express")
const router = express.Router()
const ViolationModel = require("../database/fagc/violation")
const OffenseModel = require("../database/fagc/offense")
const RevocationModel = require("../database/fagc/revocation")
const RuleModel = require("../database/fagc/rule")
const { validateUserString } = require("../utils/functions-databaseless")
const { getCommunity, checkUser } = require("../utils/functions")
const { violationCreatedMessage, violationRevokedMessage } = require("../utils/info")

/* GET home page. */
router.get("/", function (req, res) {
	res.json({ info: "Violations API Homepage!" })
})
router.get("/getviolations", async (req, res) => {
	if (req.query.playername === undefined || typeof (req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}` })
	if (req.query.communityid === undefined || typeof (req.query.communityid) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `communityid expected string, got ${typeof (req.query.communityid)} with value of ${req.query.communityid}` })
	if (!validateUserString(req.query.communityid))
		return res.status(400).json({ error: "Bad Request", description: `communityid is not correct ID, got value of ${req.query.communityid}` })

	const dbRes = await ViolationModel.find({
		playername: req.query.playername,
		communityid: req.query.communityid
	})
	res.status(200).json(dbRes)
})
router.get("/getall", async (req, res) => {
	if (req.query.playername === undefined || typeof (req.query.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}` })
	const dbRes = await ViolationModel.find({
		playername: req.query.playername
	}).populate("violations")
	res.status(200).json(dbRes)
})
router.get("/getbyid", async (req, res) => {
	if (req.query.id === undefined || !validateUserString(req.query.id))
		return res.status(400).json({ error: "Bad Request", description: `id expected ID, got ${typeof (req.query.id)} with value of ${req.query.id}` })
	const dbRes = await ViolationModel.findOne({ id: req.query.id })
	res.status(200).json(dbRes)
})
router.get("/getbyrule", async (req, res) => {
	if (req.query.id === undefined || !validateUserString(req.query.id))
		return res.status(400).json({ error: "Bad Request", description: `id must be ID, got ${req.query.id}` })
	const violations = await ViolationModel.find({
		brokenRule: req.query.id
	})
	res.status(200).json(violations)
})

router.post("/create", async (req, res) => {
	if (req.body.playername === undefined || typeof (req.body.playername) !== "string" || !req.body.playername.length)
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}` })
	if (req.body.adminid === undefined || typeof (req.body.adminid) !== "string" || !req.body.adminid.length)
		return res.status(400).json({ error: "Bad Request", description: `adminid expected string, got ${typeof (req.body.adminid)} with value of ${req.body.adminid}` })
	if (req.body.brokenRule === undefined || !validateUserString(req.body.brokenRule))
		return res.status(400).json({ error: "Bad Request", description: `brokenRule expected ID, got ${typeof (req.body.brokenRule)} with value of ${req.body.brokenRule}` })
	if (req.body.automated === undefined || typeof (req.body.automated) !== "string")
		req.body.automated = "false"
	const isUser = await checkUser(req.body.adminid) // this is later as it takes a bit
	if (!isUser)
		return res.status(400).json({ error: "Bad Request", description: `adminid expected Discord user ID, got ${typeof (req.body.adminid)} which is not one` })
	
	try {
		const rule = await RuleModel.findOne({ id: req.body.brokenRule })
		if (!rule) throw "Wrong rule"
	} catch (error) {
		return res.status(400).json({ error: "Bad Request", description: "Rule must be a RuleID" })
	}
	const community = await getCommunity(req.headers.apikey)
	const dbOffense = await OffenseModel.findOne({
		playername: req.body.playername,
		communityid: community.id
	})
	const violation = await ViolationModel.create({
		playername: req.body.playername,
		communityid: community.id,
		brokenRule: req.body.brokenRule,
		proof: req.body.proof || "None",
		description: req.body.description || "None",
		automated: req.body.automated.toLowerCase() === "true" ? true : false,
		violatedTime: Date.parse(req.body.violatedTime) || new Date(),
		adminid: req.body.adminid
	})
	if (dbOffense === null || dbOffense === undefined) {
		const offense = new OffenseModel({
			playername: req.body.playername,
			communityid: community.id,
			violations: [],
		})
		offense.violations.push(violation._id)
		offense.save()
	} else {
		await OffenseModel.updateOne(
			{
				playername: req.body.playername,
				communityid: community.id
			},
			{ $push: { violations: violation._id } }
		)
	}
	let msg = violation.toObject()
	delete msg._id
	violationCreatedMessage(violation.toObject())
	return res.status(200).json(msg)
})
router.delete("/revoke", async (req, res) => {
	if (req.body.id === undefined || !validateUserString(req.body.id))
		return res.status(400).json({ error: "Bad Request", description: `id expected ID, got ${typeof (req.body.id)} with value of ${req.body.id}` })
	if (req.body.adminid === undefined || typeof (req.body.adminid) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `adminid expected string, got ${typeof (req.body.adminid)} with value of ${req.body.adminid}` })
	const isUser = await checkUser(req.body.adminid)
	if (!isUser)
		return res.status(400).json({ error: "Bad Request", description: `adminid expected Discord user ID, got ${typeof (req.body.adminid)} which is not one` })

	const community = await getCommunity(req.headers.apikey)
	const toRevoke = await ViolationModel.findOne({ id: req.body.id })
	if (toRevoke === undefined || toRevoke === null)
		return res.status(404).json({ error: "Not Found", description: `Violation with ID ${req.body.id} not found` })
	if (!toRevoke.communityid == community.id)
		return res.status(403).json({ error: "Access Denied", description: `You are trying to access a violation of community ${toRevoke.communityid} but your community ID is ${community.id}` })

	const violation = await ViolationModel.findByIdAndDelete(toRevoke._id)
	await OffenseModel.updateOne(
		{
			violations: toRevoke._id
		},
		{ $pull: { violations: toRevoke._id } }
	)
	await OffenseModel.deleteOne(
		{ violations: { $size: 0 } }
	)
	let revocation = await RevocationModel.create({
		playername: violation.playername,
		communityid: violation.communityid,
		adminid: violation.adminid,
		brokenRule: violation.brokenRule,
		proof: violation.proof,
		description: violation.description,
		automated: violation.automated,
		violatedTime: violation.violatedTime,
		revokedTime: new Date(),
		revokedBy: req.body.adminid
	})
	let msg = revocation.toObject()
	delete msg._id
	violationRevokedMessage(msg)
	res.status(200).json(msg)
})
router.delete("/revokeallname", async (req, res) => {
	if (req.body.adminid === undefined || typeof (req.body.adminid) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `adminid expected string, got ${typeof (req.body.adminid)} with value of ${req.body.adminid}` })
	if (req.body.playername === undefined || typeof (req.body.playername) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}` })
	const isUser = await checkUser(req.body.adminid)
	if (!isUser)
		return res.status(400).json({ error: "Bad Request", description: `adminid expected Discord user ID, got ${typeof (req.body.adminid)} which is not one` })

	const community = await getCommunity(req.headers.apikey)
	const toRevoke = await OffenseModel.findOne({
		playername: req.body.playername,
		communityid: community.id
	})
	if (toRevoke === undefined || toRevoke === null)
		return res.status(404).json({ error: "Not Found", description: `Violation with player name ${req.body.playername} not found` })
	if (toRevoke.communityid != community.id)
		return res.status(403).json({ error: "Access Denied", description: `You are trying to access a violation of community ${toRevoke.communityid} but your community ID is ${community.communityid}` })

	// first get the offense and delete that first, so the caller can get the raw violations - not just IDs
	const offense = await OffenseModel.findByIdAndDelete(toRevoke._id).populate("violations").then(r=>r?.toObject())
	const revocations = await Promise.all(toRevoke.violations.map(async (violationID) => {
		const violation = await ViolationModel.findByIdAndDelete(violationID)
		const revocation = await RevocationModel.create({
			playername: violation.playername,
			communityid: violation.communityid,
			adminid: violation.adminid,
			brokenRule: violation.brokenRule,
			proof: violation.proof,
			description: violation.description,
			automated: violation.automated,
			violatedTime: violation.violatedTime,
			revokedTime: new Date(),
			revokedBy: req.body.adminid
		})
		violationRevokedMessage(revocation.toObject())
		return revocation
	}))
	offense.violations = revocations
	res.status(200).json(offense)
})

module.exports = router