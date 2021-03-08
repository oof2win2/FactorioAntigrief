const express = require('express');
const router = express.Router();
const rule = require("../database/schemas/rule")
const authUser = require("../utils/authUser")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.get('/getID', async (req, res) => {
    console.log(req.body)
    if (req.body.id == undefined || !Number.isInteger(parseInt(req.body.id)))
        return res.status(404).send(`WrongRequest: RuleID is of wrong type, must be number. Recieved ${req.body.id} as param`)
    const dbRes = await rule.findOne({ id: parseInt(req.body.id) })
    res.status(200).json(dbRes)
})
router.post('/setrule', async (req, res) => {
    if (req.body.id === undefined || !Number.isInteger(parseInt(req.body.id)))
        return res.status(404).send(`WrongRequest: RuleID is of wrong type, must be number. Recieved ${req.body.id} as param`)
    if (req.body.shortdesc === undefined || typeof(req.body.shortdesc) !== "string")
        return res.status(404).send(`WrongRequest: RuleShortdesc is of wrong type, must be string. Recieved ${req.body.id} as param`)
    if (req.body.longdesc === undefined || typeof (req.body.longdesc) !== "string")
        return res.status(404).send(`WrongRequest: RuleLongdesc is of wrong type, must be string. Recieved ${req.body.id} as param`)

    const authenticated = await authUser(req)
    if (authenticated === 404)
        return res.status(404).send("AuthenticationError: API key is wrong")
    if (authenticated === 401)
        return res.status(410).send("AuthenticationError: IP adress whitelist mismatch")

    if (req.body.shortdesc.length > 96)
        return res.status(413).send("RuleError: Shortdesc too long, must be below 96 chars")
    if (req.body.shortdesc.length > 512)
        return res.status(413).send("RuleError: Longdesc too long, must be below 512 chars")
    let found = await rule.findOne({id: req.body.id})
    if (found !== null)
        return res.status(403).send(`DuplicateError: Duplicate Rule ID: ${req.body.id} is already used by another rule!`)
    const dbRes = await rule.create({
        id: req.body.id,
        shortdesc: req.body.shortdesc,
        longdesc: req.body.longdesc
    })
    res.status(200).json(dbRes)
})
module.exports = router
