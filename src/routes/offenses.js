const express = require('express')
const router = express.Router()
const OffenseModel = require("../database/schemas/offense")
// const AuthModel = require("../database/schemas/authentication")
// const CommunityModel = require("../database/schemas/community")
// const RevocationModel = require("../database/schemas/revocation")
// const ViolationModel = require("../database/schemas/violation")
const ObjectId = require('mongoose').Types.ObjectId
// const { offenseRevokedMessage } = require("../utils/info")


/* GET home page. */
router.get('/', function (req, res) {
    res.json({message:'Offenses API Homepage!'})
})
router.get('/getcommunity', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}`})
    if (req.query.communityname === undefined || typeof (req.query.communityname) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `communityname expected string, got ${typeof (req.query.communityname)} with value of ${req.query.communityname}`})
    
    const offense = await OffenseModel.findOne({
        playername: req.query.playername,
        communityname: req.query.communityname,
    }).populate('violations')
    res.status(200).json(offense)
})
router.get('/getall', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}` })
    const offense = await OffenseModel.find({
        playername: req.query.playername,
    }).populate('violations')
    res.status(200).json(offense)
})
router.get('/getbyid', async (req, res) => {
    if (req.query.id === undefined || typeof (req.query.id) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `id expected string, got ${typeof (req.query.id)} with value of ${req.query.id}`})
    if (!ObjectId.isValid(req.query.id))
        return res.status(400).json({ error: "Bad Request", description: `id is not correct ObjectID, got value of ${req.query.id}`})

    const offense = await OffenseModel.findById(req.body.id).populate('violations')
    res.status(200).json(offense)
})
// router.delete('/revoke', async (req, res) => {
//     if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
//         return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
//     if (req.body.adminname === undefined || typeof (req.body.adminname) !== 'string')
//         return res.status(400).json({error: "Bad Request", description: `adminname expected string, got ${typeof (req.body.adminname)} with value of ${req.body.adminname}`})
//     const auth = await AuthModel.findOne({ apiKey: req.headers.apikey })
//     const community = await CommunityModel.findOne({
//         name: auth.communityname
//     })
//     const toRevoke = await OffenseModel.findOne({
//         playername: req.body.playername,
//         communityname: community.name
//     }).populate('violations')
//     if (toRevoke === null || toRevoke.communityname === undefined)
//         return res.status(404).json({error: "Resource Not Found", description: `Offense in community ${community.name} from player ${req.body.playername} not found`})
//     if (toRevoke.communityname !== community.name)
//         return res.status(403).json({error:"Access Denied", description: `Belongs to community ${toRevoke.communityname} whilst you are ${community.name}`})
//     let revocationArr = toRevoke.violations.map((violation) => {
//         ViolationModel.findByIdAndDelete(violation._id)
//         console.log(violation.brokenRule)
//         return {
//             playername: violation.playername,
//             communityname: violation.communityname,
//             adminname: violation.adminname,
//             brokenRule: violation.brokenRule,
//             proof: violation.proof,
//             description: violation.description,
//             automated: violation.automated,
//             violatedTime: violation.violatedTime,
//             revokedTime: new Date(),
//             revokedBy: req.body.adminname
//         }
//     })
//     OffenseModel.findByIdAndDelete(toRevoke._id)
//     const revocations = await RevocationModel.insertMany(revocationArr)
//     offenseRevokedMessage(revocations)
//     res.status(200).json(revocations)
// })

module.exports = router