const express = require('express');
const router = express.Router();
const CommunityModel = require("../database/schemas/community")
const AuthModel = require("../database/schemas/authentication")
// const cryptoRandomString = require('crypto-random-string')
// const ObjectId = require('mongoose').Types.ObjectId
// const { communityCreatedMessage, communityRemovedMessage } = require("../utils/info")

/* GET home page. */
router.get('/', function (req, res) {
    res.json({message: 'Community API Homepage!'})
})
// TODO: create documentation for all endpoints & maybe change to swagger-jsdoc instead of this
/**
 * Gets your own community based on your API key, which must be in your request headers.
 * @route GET /communities/getown
 * @group communities - Operations concerning communities
 * @returns {object} 200 - Object of the community that the API key in the request headers belongs to
 */
router.get('/getown', async (req, res) => {
    console.log(req.headers.apikey)
    if (req.headers.apikey === undefined)
        return res.status(400).json({ error: "Bad Request", description: "No way to find you community without an API key" })
    const auth = await AuthModel.findOne({ apiKey: req.headers.apikey })
    if (!auth)
        return res.status(404).json({error:"Not Found", description: "Community with your API key was not found"})
    const dbRes = await CommunityModel.findOne({
        name: auth.communityname
    })
    res.status(200).json(dbRes)
})
router.get('/getall', async (req, res) => {
    const dbRes = await CommunityModel.find({ name: { $exists: true } })
    res.status(200).json(dbRes)
})
router.get('/getid', async (req, res) => {
    if (req.query.id === undefined || !ObjectId.isValid(req.query.id))
        return res.status(400).json({ error: "Bad Request", description: `id must be ObjectID, got ${req.query.id}` })
    const community = await CommunityModel.findById(req.query.id)
    res.status(200).json(community)
})

router.post('/addwhitelist', async (req, res) => {
    if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
        return res.status(400).json({error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}`})
    const dbRes = await AuthModel.findOneAndUpdate({ apiKey: req.headers.apikey }, { $push: { "allowedIPs": req.body.ip } }, {new:true})
    res.status(200).json(dbRes)
})
router.delete('/removewhitelist', async (req, res) => {
    if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}` })
    const dbRes = await AuthModel.findOneAndUpdate({ apiKey: req.headers.apikey }, { $pull: { "allowedIPs": req.body.ip } }, {new:true})
    res.status(200).json(dbRes)
})
router.get('/getwhitelist', async (req, res) => {
    const dbRes = await AuthModel.findOne({ apiKey: req.headers.apikey })
    res.status(200).json(dbRes)
})

module.exports = router