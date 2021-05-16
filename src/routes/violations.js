const express = require('express');
const router = express.Router();
const ViolationModel = require("../database/fagc/violation")
const OffenseModel = require("../database/fagc/offense")
const RevocationModel = require("../database/fagc/revocation")
const RuleModel = require("../database/fagc/rule")
const ObjectId = require('mongoose').Types.ObjectId
const { getCommunity, checkUser } = require("../utils/functions");
const { violationCreatedMessage, violationRevokedMessage } = require("../utils/info")

/* GET home page. */
router.get('/', function (req, res) {
    res.json({info:'Violations API Homepage!'})
})
router.get('/getviolations', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}`})
	if (req.query.communityid === undefined || typeof (req.query.communityid) !== 'string')
		return res.status(400).json({ error: "Bad Request", description: `communityid expected string, got ${typeof (req.query.communityid)} with value of ${req.query.communityid}`})
	if (!ObjectId.isValid(req.query.communityid))
		return res.status(400).json({ error: "Bad Request", description: `communityid is not correct ObjectID, got value of ${req.query.communityid}` })
	const dbRes = await ViolationModel.find({
        playername: req.query.playername,
		communityid: req.query.communityid
    }).populate('violations')
    res.status(200).json(dbRes)
})
router.get('/getall', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}` })
    const dbRes = await ViolationModel.find({
        playername: req.query.playername
    }).populate('violations')
    res.status(200).json(dbRes)
})
router.get('/getbyid', async (req, res) => {
    if (req.query.id === undefined || !ObjectId.isValid(req.query.id))
        return res.status(400).json({ error: "Bad Request", description: `id expected ObjectID, got ${typeof (req.query.id)} with value of ${req.query.id}`})
    const dbRes = await ViolationModel.findById(req.query.id)
    res.status(200).json(dbRes)
})
router.get('/getbyrule', async (req, res) => {
    if (req.query.id === undefined || !ObjectId.isValid(req.query.id))
        return res.status(400).json({ error: "Bad Request", description: `id must be ObjectID, got ${req.query.id}` })
    const violations = await ViolationModel.find({
        broken_rule: req.query.id
    })
    res.status(200).json(violations)
})

router.post('/create', async (req, res) => {
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string' || !req.body.playername.length)
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
	if (req.body.admin_id === undefined || typeof (req.body.admin_id) !== 'string' || !req.body.admin_id.length)
		return res.status(400).json({ error: "Bad Request", description: `admin_id expected string, got ${typeof (req.body.admin_id)} with value of ${req.body.admin_id}`})
    if (req.body.broken_rule === undefined || !ObjectId.isValid(req.body.broken_rule))
        return res.status(400).json({ error: "Bad Request", description: `broken_rule expected ObjectID, got ${typeof (req.body.broken_rule)} with value of ${req.body.broken_rule}`})
    if (req.body.automated === undefined || typeof (req.body.automated) !== "string")
        req.body.automated = "false"
	const isUser = await checkUser(req.body.admin_id) // this is later as it takes a bit
	if (!isUser)
		return res.status(400).json({ error: "Bad Request", description: `admin_id expected Discord user ID, got ${typeof (req.body.admin_id)} which is not one` })
    try {
        const rule = await RuleModel.findById(req.body.broken_rule)
        if (rule === null) throw "Wrong rule"
    } catch (error) {
        return res.status(400).json({error: "Bad Request", description: "Rule must be a RuleID"})
    }
    const community = await getCommunity(req.headers.apikey)
	const dbOffense = await OffenseModel.findOne({
        playername: req.body.playername,
		communityid: community._id
    })
    const violation = await ViolationModel.create({
        playername: req.body.playername,
		communityid: community._id,
        broken_rule: req.body.broken_rule,
        proof: req.body.proof || "None",
        description: req.body.description || "None",
        automated: req.body.automated.toLowerCase() === "true" ? true : false,
        violated_time: Date.parse(req.body.violated_time) || new Date(),
		admin_id: req.body.admin_id
    })
    if (dbOffense === null || dbOffense === undefined) {
        const offense = new OffenseModel({
            playername: req.body.playername,
			communityid: community._id,
            violations: []
        })
        offense.violations.push(violation._id)
        offense.save()
    } else {
        await OffenseModel.updateOne(
            {
                playername: req.body.playername,
				communityid: community._id
            },
            { $push: { violations: violation._id } }
        )
    }
    violationCreatedMessage(violation.toObject())
    return res.status(200).json(violation.toObject())
})
router.delete('/revoke', async (req, res) => {
    if (req.body.id === undefined || !ObjectId.isValid(req.body.id))
        return res.status(400).json({error:`Bad Request`, description:`id expected ObjectID, got ${typeof (req.body.id)} with value of ${req.body.id}`})
	if (req.body.admin_id === undefined || typeof (req.body.admin_id) !== 'string')
		return res.status(400).json({ error: `Bad Request`, description: `admin_id expected string, got ${typeof (req.body.admin_id)} with value of ${req.body.admin_id}`})
	const isUser = await checkUser(req.body.admin_id)
	if (!isUser)
		return res.status(400).json({ error: "Bad Request", description: `admin_id expected Discord user ID, got ${typeof (req.body.admin_id)} which is not one` })

    const community = await getCommunity(req.headers.apikey)
    const toRevoke = await ViolationModel.findById(req.body.id)
    if (toRevoke === undefined || toRevoke === null)
        return res.status(404).json({error:`Not Found`, description: `Violation with ID ${req.body.id} not found`})
	if (!toRevoke.communityid.equals(community._id))
		return res.status(403).json({ error: "Access Denied", description: `You are trying to access a violation of community ${toRevoke.communityid} but your community ID is ${community._id}`})
    
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
		admin_id: violation.admin_id,
        broken_rule: violation.broken_rule,
        proof: violation.proof,
        description: violation.description,
        automated: violation.automated,
        violated_time: violation.violated_time,
        revokedTime: new Date(),
		revokedBy: req.body.admin_id
    })

    violationRevokedMessage(revocation.toObject())
    res.status(200).json(revocation.toObject())
})
router.delete('/revokeallname', async (req, res) => {
	if (req.body.admin_id === undefined || typeof (req.body.admin_id) !== 'string')
		return res.status(400).json({ error: "Bad Request", description: `admin_id expected string, got ${typeof (req.body.admin_id)} with value of ${req.body.admin_id}`})
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
	const isUser = await checkUser(req.body.admin_id)
	if (!isUser)
		return res.status(400).json({ error: "Bad Request", description: `admin_id expected Discord user ID, got ${typeof (req.body.admin_id)} which is not one` })

    const community = await getCommunity(req.headers.apikey)
    const toRevoke = await OffenseModel.findOne({
        playername: req.body.playername,
		communityid: community._id
    })
    if (toRevoke === undefined || toRevoke === null)
        return res.status(404).json({ error: "Not Found", description: `Violation with player name ${req.body.playername} not found`})
	if (!toRevoke.communityid.equals(community._id))
		return res.status(403).json({ error: "Access Denied", description: `You are trying to access a violation of community ${toRevoke.communityid} but your community ID is ${community.communityid}`})
    
    // first get the offense and delete that first, so the caller can get the raw violations - not just IDs
    const offense = await OffenseModel.findByIdAndDelete(toRevoke._id).populate('violations')
    toRevoke.violations.forEach((violationID) => {
        ViolationModel.findByIdAndDelete(violationID).then((violation) => {
            RevocationModel.create({
                playername: violation.playername,
				communityid: violation.communityid,
				admin_id: violation.admin_id,
                broken_rule: violation.broken_rule,
                proof: violation.proof,
                description: violation.description,
                automated: violation.automated,
                violated_time: violation.violated_time,
                revokedTime: new Date(),
				revokedBy: req.body.admin_id
            })
                .then((revocation) => {
                    violationRevokedMessage(revocation.toObject())
                })
                .catch((error) => {
                    console.error(error)
                })
        })
    })
    res.status(200).json(offense)
})

module.exports = router