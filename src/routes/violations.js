const express = require('express');
const router = express.Router();
const ViolationModel = require("../database/schemas/violation")
const OffenseModel = require("../database/schemas/offense")
const RevocationModel = require("../database/schemas/revocation")
const RuleModel = require("../database/schemas/rule")
const ObjectId = require('mongoose').Types.ObjectId
const { getCommunity } = require("../utils/functions");
const { violationCreatedMessage, violationRevokedMessage } = require("../utils/info")

/* GET home page. */
router.get('/', function (req, res) {
    res.json({info:'Violations API Homepage!'})
})
router.get('/getviolations', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}`})
    if (req.query.communityname === undefined || typeof (req.query.communityname) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `communityname expected string, got ${typeof (req.query.communityname)} with value of ${req.query.communityname}`})
    const dbRes = await ViolationModel.find({
        playername: req.query.playername,
        communityname: req.query.communityname
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
        brokenRule: req.query.id
    })
    res.status(200).json(violations)
})

router.post('/create', async (req, res) => {
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string' || !req.body.playername.length)
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
    if (req.body.adminname === undefined || typeof (req.body.adminname) !== 'string' || !req.body.adminname.length)
        return res.status(400).json({ error: "Bad Request", description: `adminname expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
    if (req.body.brokenRule === undefined || !ObjectId.isValid(req.body.brokenRule))
        return res.status(400).json({ error: "Bad Request", description: `brokenRule expected ObjectID, got ${typeof (req.body.brokenRule)} with value of ${req.body.brokenRule}`})
    if (req.body.automated === undefined || typeof (req.body.automated) !== "string")
        req.body.automated = "false"
    try {
        const rule = await RuleModel.findById(req.body.brokenRule)
        if (rule === null) throw "Wrong rule"
    } catch (error) {
        return res.status(400).json({error: "Bad Request", description: "Rule must be a RuleID"})
    }
    const community = await getCommunity(req.headers.apikey)
    const dbOffense = await OffenseModel.findOne({
        playername: req.body.playername,
        communityname: community.communityname
    })
    const violation = await ViolationModel.create({
        playername: req.body.playername,
        communityname: community.communityname,
        brokenRule: req.body.brokenRule,
        proof: req.body.proof || "None",
        description: req.body.description || "None",
        automated: req.body.automated.toLowerCase() === "true" ? true : false,
        violatedTime: new Date(),
        adminname: req.body.adminname
    })
    if (dbOffense === null || dbOffense === undefined) {
        const offense = new OffenseModel({
            playername: req.body.playername,
            communityname: community.communityname,
            violations: []
        })
        offense.violations.push(violation._id)
        offense.save()
    } else {
        await OffenseModel.updateOne(
            {
                playername: req.body.playername,
                communityname: community.communityname
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
    if (req.body.adminname === undefined || typeof(req.body.adminname) !== 'string')
        return res.status(400).json({ error: `Bad Request`, description:`adminname expected string, got ${typeof (req.body.adminname)} with value of ${req.body.adminname}`})

    const community = await getCommunity(req.headers.apikey)
    const toRevoke = await ViolationModel.findById(req.body.id)
    if (toRevoke === undefined || toRevoke === null)
        return res.status(404).json({error:`Not Found`, description: `Violation with ID ${req.body.id} not found`})
    if (toRevoke.communityname !== community.communityname)
        return res.status(403).json({error:"Access Denied", description: `You are trying to access a violation of community ${toRevoke.communityname} but your community name is ${community.communityname}`})
    
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
        communityname: violation.communityname,
        adminname: violation.adminname,
        brokenRule: violation.brokenRule,
        proof: violation.proof,
        description: violation.description,
        automated: violation.automated,
        violatedTime: violation.violatedTime,
        revokedTime: new Date(),
        revokedBy: req.body.adminname
    })

    violationRevokedMessage(revocation.toObject())
    res.status(200).json(revocation.toObject())
})
router.delete('/revokeallname', async (req, res) => {
    if (req.body.adminname === undefined || typeof (req.body.adminname) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `adminname expected string, got ${typeof (req.body.adminname)} with value of ${req.body.adminname}`})
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})

    const community = await getCommunity(req.headers.apikey)
    const toRevoke = await OffenseModel.findOne({
        playername: req.body.playername,
        communityname: community.communityname
    })
    if (toRevoke === undefined || toRevoke === null)
        return res.status(404).json({ error: "Not Found", description: `Violation with player name ${req.body.playername} not found`})
    if (toRevoke.communityname !== community.communityname)
        return res.status(403).json({ error: "Access Denied", description: `You are trying to access a violation of community ${toRevoke.communityname} but your community name is ${community.communityname}`})
    
    // first get the offense and delete that first, so the caller can get the raw violations - not just IDs
    const offense = await OffenseModel.findByIdAndDelete(toRevoke._id).populate('violations')
    toRevoke.violations.forEach((violationID) => {
        ViolationModel.findByIdAndDelete(violationID).then((violation) => {
            RevocationModel.create({
                playername: violation.playername,
                communityname: violation.communityname,
                adminname: violation.adminname,
                brokenRule: violation.brokenRule,
                proof: violation.proof,
                description: violation.description,
                automated: violation.automated,
                violatedTime: violation.violatedTime,
                revokedTime: new Date(),
                revokedBy: req.body.adminname
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