const express = require('express')
const router = express.Router()
const WebhookSchema = require("../database/schemas/webhook")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.post('/addWebhook', async (req, res) => {
    if (req.body.id === undefined || typeof(req.body.id) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}`})
    if (req.body.token === undefined || typeof(req.body.token) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `token expected string, got ${typeof (req.body.token)} with value of ${req.body.token}`})
    const dbRes = await WebhookSchema.create({
        apiKey: req.headers.apikey,
        id: req.body.id,
        token: req.body.token,
        description: req.body.description
    })
    // console.log(dbRes, "result")
    res.status(200).send(dbRes)
})


module.exports = router