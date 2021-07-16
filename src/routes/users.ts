import express from "express"
import UserModel from "../database/fagc/user"
import { validateUserString } from "../utils/functions-databaseless"
import DiscordClient from "../utils/discord"
import CommunityModel from "../database/fagc/community"

const router = express.Router()

/* GET home page. */
router.get("/", function (req, res) {
	res.json({ message: "Rules API Homepage!" })
})
router.get("/getid", async (req, res) => {
	if (!req.query.id || typeof (req.query.id) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `id must be Discord user id, got ${req.query.id}` })
	const user = await UserModel.findOne({ discordUserId: req.query.id })
	return user
})

router.post("/create", async (req, res) => {
	if (!req.body.id || typeof (req.body.id) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `id must be Discord user id, got ${req.body.id}` })

	const DiscordUser = await DiscordClient.users.fetch(req.body.id)

	if (!DiscordUser)
		return res.status(400).json({ error: "Bad Request", description: `id must be Discord user id, got ${req.body.id}, which is not a valid Discord user` })

	const user = await UserModel.create({
		discordUserId: DiscordUser.id,
		discordUserTag: DiscordUser.tag,
	})
	res.status(200).json(user)
})

router.post("/addcommunityauth", async (req, res) => {
	// TODO: create the authorization completely so that it is known that the authorizer authed the user without an issue
	if (!req.body.id || typeof (req.body.id) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `id must be a Discord user id, got ${req.body.id}` })
	if (!req.body.communityId || !validateUserString(req.body.communityId))
		return res.status(400).json({ error: "Bad Request", description: `communityId must be a community ID string, got ${req.body.communityId}` })

	const user = await UserModel.findOne({ discordUserId: req.body.id })
	if (!user)
		return res.status(404).json({ error: "Bad Request", description: `user with discord ID ${req.body.id} is not registered on FAGC` })
	const community = await CommunityModel.findOne({ id: req.body.communityId })
	if (!community)
		return res.status(404).json({ error: "Bad Request", description: `community with ID ${req.body.communityId} was not found` })
	user.hasApiAccess = true
	user.communityId = community.id
	await user.save()
	res.status(200).json(user)

})

export default router