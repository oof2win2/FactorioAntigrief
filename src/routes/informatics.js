const express = require('express')
const router = express.Router()
const WebhookSchema = require("../database/schemas/webhook")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.post('/addWebhook', async (req, res) => {
    if (req.body.id === undefined || typeof(req.body.id) !== "string")
        return res.status(400).send(`Bad Request: id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}`)
    if (req.body.token === undefined || typeof(req.body.token) !== "string")
        return res.status(400).send(`Bad Request: token expected string, got ${typeof (req.body.token)} with value of ${req.body.token}`)
    if (req.body.level === undefined || isNaN(req.body.level))
        return res.status(400).send(`Bad Request: level expected number, got ${typeof (req.body.level)} with value of ${req.body.level}`)
    const dbRes = await WebhookSchema.create({
        apiKey: req.headers.apikey,
        id: req.body.id,
        token: req.body.token,
        level: parseInt(req.body.level),
        description: req.body.description
    })
    // console.log(dbRes, "result")
    res.status(200).send(dbRes)
})


module.exports = router