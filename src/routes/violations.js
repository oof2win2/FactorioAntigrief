const express = require('express');
const router = express.Router();
const ViolationModel = require("../database/schemas/violation")
const OffenseModel = require("../database/schemas/offense")
const RevocationModel = require("../database/schemas/revocation")
const { getCommunity, violationCreatedMessage, violationRevokedMessage } = require("../utils/functions");

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Violations API Homepage!')
})
router.get('/getviolations', async (req, res) => {
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
        return res.status(400).send(`Bad Request: playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`)
    if (req.body.communityname === undefined || typeof (req.body.communityname) !== 'string')
        return res.status(400).send(`Bad Request: communityname expected string, got ${typeof (req.body.communityname)} with value of ${req.body.communityname}`)
    const dbRes = await ViolationModel.find({
        playername: req.body.playername,
        communityname: req.body.communityname
    }).populate('violations')
    res.status(200).json(dbRes)
})
router.get('/getbyid', async (req, res) => {
    if (req.body.id === undefined || typeof (req.body.id) !== 'string')
        return res.status(400).send(`Bad Request: id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}`)
    const dbRes = await ViolationModel.findById(req.body.id)
    res.status(200).json(dbRes)
})
router.post('/create', async (req, res) => {
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string' || !req.body.adminname.length)
        return res.status(400).send(`Bad Request: name expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`)
    if (req.body.adminname === undefined || typeof (req.body.adminname) !== 'string' || !req.body.adminname.length)
        return res.status(400).send(`Bad Request: adminname expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`)
    if (req.body.brokenRule === undefined || isNaN(req.body.brokenRule))
        return res.status(400).send(`Bad Request: brokenRules expected array, got ${typeof (req.body.brokenRules)} with value of ${req.body.brokenRules}`)
    if (req.body.automated === undefined || typeof (req.body.automated) !== "string")
        req.body.automated = "false"
    const community = await getCommunity(req.headers.apikey)
    const dbOffense = await OffenseModel.findOne({
        playername: req.body.playername,
        communityname: community.communityname
    })
    const violation = await ViolationModel.create({
        playername: req.body.playername,
        communityname: community.communityName,
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
    violationCreatedMessage(violation)
    return res.status(200).send(violation)
})

router.delete('/revoke', async (req, res) => {
    if (req.body.id === undefined || typeof (req.body.id) !== 'string')
        return res.status(400).send(`Bad Request: id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}`)
    if (req.body.adminname === undefined || typeof(req.body.adminname) !== 'string')
        return res.status(400).send(`Bad Request: adminname expected string, got ${typeof (req.body.adminname)} with value of ${req.body.adminname}`)

    const community = await getCommunity(req.headers.apikey)
    const toRevoke = await ViolationModel.findById(req.body.id)
    if (toRevoke === undefined || toRevoke === null)
        return res.status(404).send(`Not Found: Violation with ID ${req.body.id} not found`)
    if (toRevoke.communityname !== community.communityName)
        return res.status(403).send(`Access Denied: You are trying to access a violation of community ${toRevoke.communityname} but your community name is ${community.communityname}`)
    
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
        ViolatedTime: violation.violatedTime,
        RevokedTime: new Date(),
        revokedBy: req.body.adminname
    })

    violationRevokedMessage(revocation)
    res.status(200).json(revocation)
})

router.delete('/revokeallname', async (req, res) => {
    if (req.body.adminname === undefined || typeof (req.body.adminname) !== 'string')
        return res.status(400).send(`Bad Request: adminname expected string, got ${typeof (req.body.adminname)} with value of ${req.body.adminname}`)
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
        return res.status(400).send(`Bad Request: playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`)

    const community = await getCommunity(req.headers.apikey)
    const toRevoke = await OffenseModel.findOne({playername: req.body.playername})
    console.log(toRevoke, community)
    if (toRevoke === undefined || toRevoke === null)
        return res.status(404).send(`Not Found: Violation with player name ${req.body.playername} not found`)
    if (toRevoke.communityname !== community.communityName)
        return res.status(403).send(`Access Denied: You are trying to access a violation of community ${toRevoke.communityname} but your community name is ${community.communityname}`)
    toRevoke.violations.forEach(async (violationID) => {
        const violation = await ViolationModel.findByIdAndDelete(violationID)
        console.log(violation)
    })
    res.status(200).send("Done!")
})

module.exports = router