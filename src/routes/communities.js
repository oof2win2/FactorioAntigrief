const express = require('express');
const router = express.Router();
const CommunityModel = require("../database/schemas/community")
const AuthModel = require("../database/schemas/authentication")
const cryptoRandomString = require('crypto-random-string')

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.get('/getall', async (req, res) => {
    const dbRes = await CommunityModel.find({name: {$exists: true}})
    res.status(200).json(dbRes)
})
router.post('/create', async (req, res) => {
    if (req.body.name === undefined || typeof(req.body.name) !== "string")
        return res.status(400).send(`Bad Request: name expected string, got ${typeof(req.body.name)} with value of ${req.body.name}`)
    if (req.body.contact === undefined || typeof (req.body.contact) !== "string")
        return res.status(400).send(`Bad Request: contact expected string, got ${typeof (req.body.contact)} with value of ${req.body.contact}`)

    const apiKey = await AuthModel.create({
        communityname: req.body.name,
        apiKey: cryptoRandomString(128)
    })
    const community = await CommunityModel.create({
        name: req.body.name,
        contact: req.body.contact
    })

    res.status(200).json({
        community: community,
        key: apiKey.apiKey,
        allowedIPs: []
    })
})


// fkn doesnt work
// router.post('/addwhitelist', async (req, res) => {
//     if (req.body.ip === undefined || typeof(req.body.ip) !== "string")
//         return res.status(400).send(`Bad Request: ip expected string, got ${typeof(req.body.ip)}`)
//     const apikey = (req.body.apikey !== undefined) ? req.body.apikey : req.headers.apikey
//     let currentAuth = await AuthModel.findOne({ apiKey: apikey })
//     console.log(currentAuth)
//     let newIPs = currentAuth.allowedIPs
//     newIPs.push(req.body.ip)
//     const dbRes = await AuthModel.findOneAndUpdate(currentAuth, {allowedIPs: newIPs})
//     res.status(200).json(dbRes)
// })
// router.post('/getwhitelist', async (req, res) => {
//     const dbRes = await AuthModel.findOne({apiKey: req.headers.apiKey})
// })

module.exports = router