// TODO: remove this no-unreachable thingy
/* eslint-disable no-unreachable */
const express = require('express');
const router = express.Router();
const CommunityModel = require("../database/fagc/community")
const RuleModel = require("../database/fagc/rule")
const AuthModel = require("../database/fagc/authentication")
const CommunityConfigModel = require("../database/bot/community")
const { validateUserString } = require("../utils/functions-databaseless")
const { checkUser } = require("../utils/functions")
const { communityConfigChanged } =require("../utils/info")

/* GET home page. */
router.get('/', function (req, res) {
	res.json({ message: 'Community API Homepage!' })
})
router.get('/getown', async (req, res) => {
	if (req.headers.apikey === undefined)
		return res.status(400).json({ error: "Bad Request", description: "No way to find you community without an API key" })
	const auth = await AuthModel.findOne({ api_key: req.headers.apikey })
	if (!auth)
		return res.status(404).json({ error: "Not Found", description: "Community with your API key was not found" })
	const dbRes = await CommunityModel.findById(auth.communityid) // Internal search
	res.status(200).json(dbRes)
})
router.get('/getall', async (req, res) => {
	const dbRes = await CommunityModel.find({ name: { $exists: true } })
	res.status(200).json(dbRes)
})
router.get('/getid', async (req, res) => {
	if (req.query.id === undefined || !validateUserString(req.query.id))
		return res.status(400).json({ error: "Bad Request", description: `id must be ID, got ${req.query.id}` })
	const community = await CommunityModel.findOne({id: req.query.id })
	res.status(200).json(community)
})

// Interacts with the bot's database
router.get('/getconfig', async (req, res) => {
	if (req.query.guildid === undefined || typeof (req.query.guildid) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `guildid must be Discord GuildID (snowflake), got ${req.query.guildid}` })
	let CommunityConfig = await CommunityConfigModel.findOne({
		guildid: req.query.guildid
	})

	if (CommunityConfig) {
		CommunityConfig = CommunityConfig.toObject()
		delete CommunityConfig.apikey
	}
	res.status(200).json(CommunityConfig)
})
router.post('/setconfig', async (req, res) => {
	if (req.body.ruleFilters) {
		if (!Array.isArray(req.body.ruleFilters))
			return res.status(400).json({ error: "Bad Request", description: `ruleFilters must be array of IDs, got ${req.body.ruleFilters}` })
		if (req.body.ruleFilters.map((ruleFilter) => !validateUserString(ruleFilter)).filter(i => i)[0])
			return res.status(400).json({ error: "Bad Request", description: `ruleFilters must be array of IDs, got ${req.body.ruleFilters}` })
	}
	if (req.body.trustedCommunities) {
		if (!Array.isArray(req.body.trustedCommunities))
			return res.status(400).json({ error: "Bad Request", description: `trustedCommunities must be array of IDs, got ${req.body.trustedCommunities}` })
		if (req.body.trustedCommunities.map((community) => !validateUserString(community)).filter(i => i)[0])
			return res.status(400).json({ error: "Bad Request", description: `trustedCommunities must be array of IDs, got ${req.body.trustedCommunities}` })
	}

	if (req.body.contact &&  typeof (req.body.contact) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `contact must be Discord User snowflake, got ${typeof (req.body.contact)} with value ${req.body.contact}` })
	if (req.body.moderatorroleId && typeof (req.body.moderatorroleId) !== "string")
			return res.status(400).json({ error: "Bad Request", description: `moderatorroleId must be Discord role snowflake, got ${typeof (req.body.moderatorroleId)} with value ${req.body.moderatorroleId}` })
	if (req.body.communityname && typeof (req.body.communityname) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `communityname must be string, got ${typeof (req.body.communityname)} with value ${req.body.communityname}` })


	// query database if rules and communities actually exist
	if (req.body.ruleFilters) {
		const rulesExist = await RuleModel.find({ id: { $in: req.body.ruleFilters } })
		if (rulesExist.length !== req.body.ruleFilters.length)
			return res.status(400).json({ error: "Bad Request", description: `ruleFilters must be array of IDs of rules, got ${req.body.ruleFilters.toString()}, some of which are not real rule IDs` })
	}
	if (req.body.trustedCommunities) {
		const communitiesExist = await CommunityModel.find({ id: { $in: req.body.trustedCommunities } })
	if (communitiesExist.length !== req.body.trustedCommunities.length)
		return res.status(400).json({ error: "Bad Request", description: `trustedCommunities must be array of IDs of communities, got ${req.body.trustedCommunities.toString()}, some of which are not real community IDs` })
	}
	// check other stuff
	if (req.body.contact && !(await checkUser(req.body.contact)))
		return res.status(400).json({ error: "Bad Request", description: `contact must be Discord User snowflake, got value ${req.body.contact}, which isn't a Discord user` })
	
	let OldConfig = await CommunityConfigModel.findOne({
		apikey: req.headers.apikey
	}).then((c) => c?.toObject())
	if (!OldConfig)
		return res.status(404).json({ error: "Not Found", description: "Community config with your API key was not found" })
	delete OldConfig._id
	let CommunityConfig = await CommunityConfigModel.findOneAndReplace({ guildid: OldConfig.guildid }, {
		...OldConfig,
		...req.body,
		// ruleFilters: req.body.ruleFilters,
		// trustedCommunities: req.body.trustedCommunities,
		// contact: req.body.contact,
		// moderatorroleId: req.body.moderatorroleId,
		// communityid: OldConfig.communityid,
		// communityname: req.body.communityname,
		guildid: OldConfig.guildid,
		apikey: req.headers.apikey,
	}, { new: true })
	CommunityConfig = CommunityConfig.toObject()
	await CommunityModel.findOneAndUpdate({ guildid: OldConfig.guildid }, {
		guildid: OldConfig.guildid,
		name: CommunityConfig.communityname,
		contact: CommunityConfig.contact,
	})
	delete CommunityConfig.apikey
	communityConfigChanged(CommunityConfig)
	res.status(200).json(CommunityConfig)
})

// IP whitelists
router.post('/addwhitelist', async (req, res) => {
	if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}` })
	const dbRes = await AuthModel.findOneAndUpdate({ api_key: req.headers.apikey }, { $push: { "allowed_ips": req.body.ip } }, { new: true })
	res.status(200).json(dbRes)
})
router.delete('/removewhitelist', async (req, res) => {
	if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}` })
	const dbRes = await AuthModel.findOneAndUpdate({ api_key: req.headers.apikey }, { $pull: { "allowed_ips": req.body.ip } }, { new: true })
	res.status(200).json(dbRes)
})

module.exports = router