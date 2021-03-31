const express = require('express')
const router = express.Router()
const WebhookSchema = require("../database/schemas/webhook")
const LogSchema = require("../database/schemas/log")

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
    res.status(200).send(dbRes)
})
router.delete('/removeWebhook', async (req, res) => {
    if (req.body.id === undefined || isNaN(req.body.id))    
        return res.status(400).json({ error: "Bad Request", description: `id expected string, got ${typeof (req.body.id)} with value of ${req.body.id}` })
    const removed = await WebhookSchema.findOneAndDelete({
        id: req.body.id,
        apiKey: req.headers.apikey
    })
    res.status(200).json(removed)
})
router.get('/getlogs', async (req, res) => {
    if (req.query.limit === undefined || isNaN(req.query.limit))
        return res.status(400).json({ error: "Bad Request", description: `limit expected number, got ${typeof(req.query.limit)} with value ${req.query.limit}`})
    if (req.query.afterDate !== undefined && isNaN (req.query.afterDate))
        return res.status(400).json({ error: "Bad Request", description: `afterDate expected nothing or number, got ${typeof (req.query.afterDate)} with value ${req.query.afterDate}`})
    const logsRaw = await LogSchema.find({
        timestamp: { $gte: parseInt(req.query.afterDate || 0) }
    }, {}, {limit: parseInt(req.query.limit)})
    const logsFiltered = logsRaw.map((log) => {
        log.apiKey = undefined
        log.ip = undefined
        if (log.responseBody && log.responseBody.key) log.responseBody.key = undefined
        return log
    })
    res.status(200).json(logsFiltered)
})


module.exports = router