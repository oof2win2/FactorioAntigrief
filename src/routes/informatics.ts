import express from "express"
const router = express.Router()
import WebhookSchema from "../database/fagc/webhook"
import LogSchema from "../database/fagc/log"
import { WebhookClient } from "discord.js"

/* GET home page. */
router.get("/", function (req, res) {
	res.json({ message: "Informatics API Homepage!" })
})
router.post("/addwebhook", async (req, res) => {
	if (req.body.id === undefined || typeof (req.body.id) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}` })
	if (req.body.token === undefined || typeof (req.body.token) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `token expected string, got ${typeof (req.body.token)} with value of ${req.body.token}` })
	if (req.body.guildId === undefined || typeof (req.body.guildId) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `guildId expected string, got ${typeof (req.body.guildId)} with value ${req.body.guildId}` })
	const found = await WebhookSchema.findOne({ guildId: req.body.guildId })
	if (found)
		return res.status(403).json({ error: "Forbidden", description: `webhook in the guild ${req.body.guildId} already exists` })
	const dbRes = await WebhookSchema.create({
		token: req.body.token,
		guildId: req.body.guildId,
	})
	const client = new WebhookClient(req.body.id, req.body.token)
	client.send("Testing message from the FAGC API!").catch(console.error)
	res.status(200).json(dbRes)
})
router.delete("/removewebhook", async (req, res) => {
	if (req.body.id === undefined || isNaN(req.body.id))
		return res.status(400).json({ error: "Bad Request", description: `id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}` })
	if (req.body.token === undefined || typeof (req.body.token) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `token expected string, got ${typeof (req.body.token)} with value of ${req.body.token}` })
	if (req.body.guildId === undefined || typeof (req.body.guildId) !== "string")
		return res.status(400).json({ error: "Bad Request", description: `guildId expected string, got ${typeof (req.body.guildId)} with value ${req.body.guildId}` })
	const removed = await WebhookSchema.findOneAndDelete({
		id: req.body.id,
		token: req.body.token,
		guildId: req.body.guildId,
	})
	res.status(200).json(removed)
})
router.get("/getlogs", async (req, res) => {
	if (req.query.limit === undefined || typeof req.query.limit !== "number")
		return res.status(400).json({ error: "Bad Request", description: `limit expected number, got ${typeof (req.query.limit)} with value ${req.query.limit}` })
	if (req.query.afterDate !== undefined && typeof (parseInt(<string>req.query.afterDate)) !== "number")
		return res.status(400).json({ error: "Bad Request", description: `afterDate expected nothing or number, got ${typeof (req.query.afterDate)} with value ${req.query.afterDate}` })
	const afterDate = req.query.afterDate ? <number><unknown>req.query.afterDate : 0
	const logsRaw = await LogSchema.find({
		timestamp: { $gte: new Date(afterDate) }
	}, {}, { limit: parseInt(req.query.limit) })
	const logsFiltered = logsRaw.map((log) => {
		log = log.toObject()
		delete log.apikey
		delete log.ip
		if (log.responseBody && log.responseBody.key) delete log.responseBody.key
		return log
	})
	res.status(200).json(logsFiltered)
})


export default router