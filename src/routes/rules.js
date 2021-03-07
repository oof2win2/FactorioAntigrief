const express = require('express');
const router = express.Router();
const rule = require("../database/schemas/rule")
const authUser = require("../utils/authUser")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.get('/getID', async (req, res) => {
    if (req.query.id == undefined || !Number.isInteger(parseInt(req.query.id))) return res.status(404).json({
        "WrongRequest": `RuleID is of wrong type, must be number. Recieved ${req.query.id} as param`
    })
    const dbRes = await rule.findOne({ id: parseInt(req.query.id) })
    console.log((await authUser(req)))
    res.status(200).json(dbRes)
})
router.post('/setrule', async (req, res) => {
    console.log('got here!')
    if (req.query.id === undefined || !Number.isInteger(parseInt(req.query.id))) return res.status(404).json({
        "WrongRequest": `RuleID is of wrong type, must be number. Recieved ${req.query.id} as param`
    })
    if (req.query.shortdesc === undefined || typeof(req.query.shortdesc) !== "string") return res.status(404).json({
        "WrongRequest": `RuleShortdesc is of wrong type, must be string. Recieved ${req.query.id} as param`
    })
    if (req.query.longdesc === undefined || typeof (req.query.longdesc) !== "string") return res.status(404).json({
        "WrongRequest": `RuleLongdesc is of wrong type, must be string. Recieved ${req.query.id} as param`
    })
    console.log((await authUser(req)))
    return res.status(404);
    const dbRes = await rule.create({
        id: req.query.id,
        shortdesc: req.query.shortdesc,
        longdesc: req.query.longdesc
    })
    res.status(200).json(dbRes)
})
module.exports = router
