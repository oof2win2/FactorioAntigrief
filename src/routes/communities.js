const express = require('express');
const router = express.Router();
const CommunityModel = require("../database/fagc/community")
const AuthModel = require("../database/fagc/authentication")
const CommunityConfigModel = require("../database/bot/community")
// const cryptoRandomString = require('crypto-random-string')
const ObjectId = require('mongoose').Types.ObjectId
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
    if (req.headers.apikey === undefined)
        return res.status(400).json({ error: "Bad Request", description: "No way to find you community without an API key" })
    const auth = await AuthModel.findOne({ api_key: req.headers.apikey })
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

// [X] get community config from guildid, censor api key
// [X] get community database schema synced with both backend & bot
router.get('/getconfig', async (req, res) => {
    if (req.query.id === undefined || typeof(req.query.id) !== "string")
        return res.status(400).json({error: "Bad Request", description: `id must be Discord GuildID (snowflake), got ${req.query.id}`})
	let CommunityConfig = await CommunityConfigModel.findOne({
		guildid: req.query.id
	})

	if (CommunityConfig) {
		CommunityConfig = CommunityConfig.toObject()
		delete CommunityConfig.apikey
	} 
    res.status(200).json(CommunityConfig)
})
router.post('/setconfig', async (req, res) => {
	let OldConfig = await CommunityConfigModel.findOne({
		apikey: req.headers.apikey
	})
	if (!OldConfig)
		return res.status(404).json({ error: "Not Found", description: "Community config with your API key was not found" })
	let CommunityConfig = await CommunityConfigModel.findOneAndReplace(OldConfig.toObject(), {
		guildid: OldConfig.guildid,
		apikey: req.headers.apikey,
		ruleFilters: req.body.ruleFilters,
		trustedCommunities: req.body.trustedCommunities,
		contact: req.body.contact,
		moderatorroleId: req.body.moderatorroleId,
		communityname: req.body.communityname,
	}, {new:true}).then((config) => config.toObject())
	delete CommunityConfig.apikey
	res.status(200).json(CommunityConfig)
})

router.post('/addwhitelist', async (req, res) => {
    if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
        return res.status(400).json({error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}`})
    const dbRes = await AuthModel.findOneAndUpdate({ api_key: req.headers.apikey }, { $push: { "allowed_ips": req.body.ip } }, {new:true})
    res.status(200).json(dbRes)
})
router.delete('/removewhitelist', async (req, res) => {
    if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}` })
    const dbRes = await AuthModel.findOneAndUpdate({ api_key: req.headers.apikey }, { $pull: { "allowed_ips": req.body.ip } }, {new:true})
    res.status(200).json(dbRes)
})
router.get('/getwhitelist', async (req, res) => {
    const dbRes = await AuthModel.findOne({ api_key: req.headers.apikey })
    res.status(200).json(dbRes)
})

module.exports = router