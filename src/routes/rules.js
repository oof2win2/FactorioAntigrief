const express = require('express');
const router = express.Router();
const RuleModel = require("../database/schemas/rule")
const { ruleCreatedMessage, ruleRemovedMessage } = require("../utils/info")
const ObjectId = require('mongoose').Types.ObjectId;

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Rules API Homepage!')
})
router.get('/getall', async (req, res) => {
    const result = await RuleModel.find()
    return res.status(200).json(result)
})
router.get('/getid', async (req, res) => {
    if (req.query.id === undefined || typeof (req.query.id) !== "string")
        return res.status(400).json({ error: "Bad Request", description: `id must be string, got ${req.query.id}`})
    console.log(`${typeof (req.query.id)} with value of ${req.query.id}`)
    if (!ObjectId.isValid(req.query.id))
        return res.status(400).send({error: "Bad Request", description: `id is not correct ObjectID, got value of ${req.body.id}`})
    const rule = await RuleModel.findById(req.query.id)
    res.status(200).json(rule)
})
router.post('/create', async (req, res) => {
    if (req.body.shortdesc === undefined || typeof(req.body.shortdesc) !== "string")
        return res.status(400).json({error: "Bad Request", description:`shortdesc must be string, got ${req.body.shortdesc}`})
    if (req.body.longdesc === undefined || typeof(req.body.longdesc) !== "string")
        return res.status(400).json({error: "Bad Request", description:`longdesc must be string, got ${req.body.longdesc}`})
    const dbRes = await RuleModel.create({
        shortdesc: req.body.shortdesc,
        longdesc: req.body.longdesc
    })
    ruleCreatedMessage(dbRes.toObject())
    res.status(200).json(dbRes)
})
router.delete('/remove', async (req, res) => {
    if (req.body.id === undefined)
        return res.status(400).send(`Bad Request: id must be object ID`)
    const dbRes = await RuleModel.findByIdAndDelete(req.body.id)
    ruleRemovedMessage(dbRes.toObject())
    res.status(200).json(dbRes)
})

module.exports = router