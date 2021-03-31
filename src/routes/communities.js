const express = require('express');
const router = express.Router();
const CommunityModel = require("../database/schemas/community")
const AuthModel = require("../database/schemas/authentication")
const cryptoRandomString = require('crypto-random-string')
const ObjectId = require('mongoose').Types.ObjectId
const { communityCreatedMessage, communityRemovedMessage } = require("../utils/info")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
// TODO: create documentation for all endpoints & maybe change to swagger-jsdoc instead of this
/**
 * Gets your own community based on your API key, which must be in your request headers.
 * @route GET /communities/getown
 * @group communities - Operations concerning communities
 * @returns {object} 200 - Object of the community that the API key in the request headers belongs to
 */
router.get('/getown', async (req, res) => {
    if (req.headers.apikey === undefined)
        return res.status(400).json({ error: "Bad Request", description: "No way to find you community without an API key" })
    const auth = await AuthModel.findOne({ apiKey: req.headers.apikey })
    const dbRes = await CommunityModel.findOne({
        name: auth.communityname
    })
    res.status(200).json(dbRes)
})
router.get('/getall', async (req, res) => {
    const dbRes = await CommunityModel.find({ name: { $exists: true } })
    res.status(200).json(dbRes)
})

router.post('/create', async (req, res) => {
    if (req.body.name === undefined || typeof (req.body.name) !== "string")
        return res.status(400).send({ error: "Bad Request", description: `name expected string, got ${typeof (req.body.name)} with value of ${req.body.name}` })
    if (req.body.contact === undefined || typeof (req.body.contact) !== "string")
        return res.status(400).send({ error: "Bad Request", description: `contact expected string, got ${typeof (req.body.contact)} with value of ${req.body.contact}` })
    const dbRes = await CommunityModel.findOne({
        name: req.body.name
    })
    if (dbRes !== null)
        return res.status(403).json({ error: "Bad Request", description: `Community with name ${req.body.name} already exists` })
    const apiKey = await AuthModel.create({
        communityname: req.body.name,
        apiKey: cryptoRandomString(128)
    })
    const community = await CommunityModel.create({
        name: req.body.name,
        contact: req.body.contact
    })

    communityCreatedMessage(community.toObject())
    res.status(200).json({
        community: community,
        key: apiKey.apiKey,
        allowedIPs: []
    })
})
// router.delete('/remove', async (req, res) => {
//     // return res.status(500).json({error: "Disabled", description: "This module is disabled for now"})
//     // works but disabled, not sure what should happen when community is removed
//     if (req.body.id === undefined || !ObjectId.isValid(req.body.id))
//         return res.status(400).json({ error: "Bad Request", description: `id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}` })
//     const community = await CommunityModel.findByIdAndDelete(req.body.id)
//     if (community === null)
//         return res.status(404).json({ error: "Not Found", description: `Community with ObjectID ${req.body.id} was not found` })
//     AuthModel.findOneAndDelete({
//         communityname: community.name
//     })
//     communityRemovedMessage(community.toObject())
//     res.status(200).json(community)
// })

router.post('/addwhitelist', async (req, res) => {
    if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
        return res.status(400).json({error: "Bad Request", description: `p expected string, got ${typeof (req.body.ip)}`})
    const dbRes = await AuthModel.findOneAndUpdate({ apiKey: req.headers.apikey }, { $push: { "allowedIPs": req.body.ip } }, {new:true})
    res.status(200).json(dbRes)
})
router.get('/getwhitelist', async (req, res) => {
    // console.log(req.headers['x-forwarded-for'] || req.socket.remoteAddress)
    const dbRes = await AuthModel.findOne({ apiKey: req.headers.apikey })
    res.status(200).json(dbRes)
})

module.exports = router