const express = require('express')
const router = express.Router()
const OffenseModel = require("../database/fagc/offense")
// const AuthModel = require("../database/fagc/authentication")
// const CommunityModel = require("../database/fagc/community")
// const RevocationModel = require("../database/fagc/revocation")
// const ViolationModel = require("../database/fagc/violation")
const ObjectId = require('mongoose').Types.ObjectId
// const { offenseRevokedMessage } = require("../utils/info")


/* GET home page. */
router.get('/', function (req, res) {
    res.json({message:'Offenses API Homepage!'})
})
router.get('/getcommunity', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.query.playername)} with value of ${req.query.playername}`})
    if (req.query.communityid === undefined || typeof (req.query.communityid) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `communityid expected string, got ${typeof (req.query.communityid)} with value of ${req.query.communityid}`})
	if (!ObjectId.isValid(req.query.communityid))
		return res.status(400).json({ error: "Bad Request", description: `communityid is not correct ObjectID, got value of ${req.query.communityid}` })
    
    const offense = await OffenseModel.findOne({
        playername: req.query.playername,
        communityid: req.query.communityid,
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
//     if (req.body.admin_name === undefined || typeof (req.body.admin_name) !== 'string')
//         return res.status(400).json({error: "Bad Request", description: `admin_name expected string, got ${typeof (req.body.admin_name)} with value of ${req.body.admin_name}`})
//     const auth = await AuthModel.findOne({ api_key: req.headers.apikey })
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
//         console.log(violation.broken_rule)
//         return {
//             playername: violation.playername,
//             communityname: violation.communityname,
//             admin_name: violation.admin_name,
//             broken_rule: violation.broken_rule,
//             proof: violation.proof,
//             description: violation.description,
//             automated: violation.automated,
//             violated_time: violation.violated_time,
//             revokedTime: new Date(),
//             revokedBy: req.body.admin_name
//         }
//     })
//     OffenseModel.findByIdAndDelete(toRevoke._id)
//     const revocations = await RevocationModel.insertMany(revocationArr)
//     offenseRevokedMessage(revocations)
//     res.status(200).json(revocations)
// })

module.exports = router