const express = require('express');
const router = express.Router();
const RuleModel = require("../database/schemas/rule")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Rules API Homepage!')
})
router.get('/getall', async (req, res) => {
    const result = await RuleModel.find({shortdesc: {$exists: true}})
    return res.status(200).json(result)
})
router.post('/create', async (req, res) => {
    if (req.body.shortdesc === undefined || typeof(req.body.shortdesc) !== "string")
        return res.status(400).send(`Bad Request: shortdesc must be string, got ${req.body.shortdesc}`)
    if (req.body.longdesc === undefined || typeof(req.body.longdesc) !== "string")
        return res.status(400).send(`Bad Request: longdesc must be string, got ${req.body.longdesc}`)
    const dbRes = await RuleModel.create({
        shortdesc: req.body.shortdesc,
        longdesc: req.body.longdesc
    })
    res.status(200).json(dbRes)
})
router.delete('/remove', async (req, res) => {
    if (req.body.id === undefined)
        return res.status(400).send(`Bad Request: id must be object ID`)
    const dbRes = await RuleModel.findByIdAndDelete(req.body.id)
    res.status(200).json(dbRes)
})

module.exports = router