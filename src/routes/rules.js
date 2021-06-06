const express = require("express")
const router = express.Router()
const RuleModel = require("../database/fagc/rule")
const { validateUserString } = require("../utils/functions-databaseless")

/* GET home page. */
router.get("/", function (req, res) {
	res.json({ message: "Rules API Homepage!" })
})
router.get("/getall", async (req, res) => {
	const result = await RuleModel.find()
	return res.status(200).json(result)
})
router.get("/getid", async (req, res) => {
	if (req.query.id === undefined || !validateUserString(req.query.id))
		return res.status(400).json({ error: "Bad Request", description: `id must be ID, got ${req.query.id}` })
	const rule = await RuleModel.findOne({ id: req.query.id })
	res.status(200).json(rule)
})

module.exports = router