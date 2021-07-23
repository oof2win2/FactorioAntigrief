import express from "express"
import CommunityModel from "../database/fagc/community"
import RuleModel from "../database/fagc/rule"
import AuthModel from "../database/fagc/authentication"
import CommunityConfigModel from "../database/bot/community"
import { validateUserString } from "../utils/functions-databaseless"
import { checkUser } from "../utils/functions"
import { communityConfigChanged } from "../utils/info"

const router = express.Router()

router.get("/getown", async (req, res) => {
	if (req.headers["authorization"] === undefined)
		return res.status(400).json({ error: "Bad Request", description: "No way to find you community without an API key" })
	const auth = await AuthModel.findOne({ api_key: req.headers["authorization"] as string })
	if (!auth)
		return res.status(404).json({ error: "Not Found", description: "Community with your API key was not found" })
	const dbRes = await CommunityModel.findById(auth.communityId) // Internal search
	res.status(200).json(dbRes)
})
router.get("/getall", async (req, res) => {
	const dbRes = await CommunityModel.find({ name: { $exists: true } })
	res.status(200).json(dbRes)
})
router.get("/getid", async (req, res) => {
	if (req.query.id === undefined || !validateUserString(req.query.id as string))
		return res.status(400).json({ error: "Bad Request", description: `id must be ID, got ${req.query.id}` })
	const community = await CommunityModel.findOne({ id: req.query.id })
	res.status(200).json(community)
})

// Interacts with the bot's database
router.get("/getconfig", async (req, res) => {
	if (req.query.guildId === undefined || typeof (req.query.guildId) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `guildId must be Discord guildId (snowflake), got ${req.query.guildId}` })
	const CommunityConfig = await CommunityConfigModel.findOne({
		guildId: req.query.guildId
	})

	if (CommunityConfig) {
		CommunityConfig.set("apikey", null)
	}
	res.status(200).json(CommunityConfig)
})
router.post("/setconfig", async (req, res) => {
	if (req.body.ruleFilters) {
		if (!Array.isArray(req.body.ruleFilters))
			return res.status(400).json({ error: "Bad Request", description: `ruleFilters must be array of IDs, got ${req.body.ruleFilters}` })
		// FIXME after express type validation
		if (req.body.ruleFilters.map((ruleFilter: string) => !validateUserString(ruleFilter)).filter((i: any) => i)[0])
			return res.status(400).json({ error: "Bad Request", description: `ruleFilters must be array of IDs, got ${req.body.ruleFilters}` })
	}
	if (req.body.trustedCommunities) {
		if (!Array.isArray(req.body.trustedCommunities))
			return res.status(400).json({ error: "Bad Request", description: `trustedCommunities must be array of IDs, got ${req.body.trustedCommunities}` })
		// FIXME after express type validation
		if (req.body.trustedCommunities.map((community: string) => !validateUserString(community)).filter((i: any) => i)[0])
			return res.status(400).json({ error: "Bad Request", description: `trustedCommunities must be array of IDs, got ${req.body.trustedCommunities}` })
	}

	if (req.body.contact && typeof (req.body.contact) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `contact must be Discord User snowflake, got ${typeof (req.body.contact)} with value ${req.body.contact}` })
	if (req.body.moderatorRoleId && typeof (req.body.moderatorRoleId) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `moderatorRoleId must be Discord role snowflake, got ${typeof (req.body.moderatorRoleId)} with value ${req.body.moderatorRoleId}` })
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

	const OldConfig = await CommunityConfigModel.findOne({
		apikey: req.headers["authorization"] as string
	})
	if (!OldConfig)
		return res.status(404).json({ error: "Not Found", description: "Community config with your API key was not found" })
	console.log(await CommunityConfigModel.findOne({ guildId: OldConfig.guildId }))
	const CommunityConfig = await CommunityConfigModel.findOneAndReplace({ guildId: OldConfig.guildId }, {
		...OldConfig.toObject(),
		...req.body,
		guildId: OldConfig.guildId,
		apikey: req.headers["authorization"],
	}, { new: true })
	if (!CommunityConfig)
		return res.status(404).json({ error: "Not Found", description: "Community config with your API key was not found" })
	await CommunityModel.findOneAndUpdate({ guildId: OldConfig.guildId }, {
		guildId: OldConfig.guildId,
		name: CommunityConfig.communityname,
		contact: CommunityConfig.contact,
	})
	CommunityConfig.set("apikey", null)
	communityConfigChanged(CommunityConfig)
	res.status(200).json(CommunityConfig)
})

// IP whitelists
router.post("/addwhitelist", async (req, res) => {
	if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}` })
	// FIXME after express type validation
	const dbRes = await AuthModel.findOneAndUpdate({ api_key: req.headers["authorization"] as string }, { $push: { "allowed_ips": req.body.ip } }, { new: true })
	res.status(200).json(dbRes)
})
router.delete("/removewhitelist", async (req, res) => {
	if (req.body.ip === undefined || typeof (req.body.ip) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `ip expected string, got ${typeof (req.body.ip)}` })
	// FIXME after express type validation
	const dbRes = await AuthModel.findOneAndUpdate({ api_key: req.headers["authorization"] as string }, { $pull: { "allowed_ips": req.body.ip } }, { new: true })
	res.status(200).json(dbRes)
})

export default router