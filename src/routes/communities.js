const express = require('express')
const router = express.Router()
const cryptoRandomString = require('crypto-random-string')
const community = require("../database/schemas/community")
const authentication = require("../database/schemas/authentication")
const authUser = require("../utils/authUser")


/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.get('/getID', async (req, res) => {
    console.log('gg')
    if (req.body.id == undefined || !Number.isInteger(parseInt(req.body.id)))
        return res.status(400).send(`WrongRequest: ID is of wrong type, must be number. Recieved ${req.body.id} as param`)
    const dbRes = await community.findOne({ communityID: parseInt(req.body.id) })
    res.status(200).json(dbRes)
})
router.get('/getName', async (req, res) => {
    if (req.body.name == undefined || typeof (req.body.name) !== "string") 
        return res.status(400).send(`WrongRequest: Name is of wrong type, must be string. Recieved ${req.body.id} as param`)
    const dbRes = await community.find({ name: req.body.name })
    res.status(200).json(dbRes)
})
router.post('/create', async (req, res) => {
    const authenticated = await authUser(req)
    if (authenticated === 404)
        return res.status(404).send("AuthenticationError: API key is wrong")
    if (authenticated === 401)
        return res.status(410).send("AuthenticationError: IP adress whitelist mismatch")
    
    // check if ID is not a number
    if (req.body.id == undefined || isNaN(req.body.id))
        return res.status(400).send(`WrongRequest: ID is of wrong type, must be number. Recieved ${req.body.id} as param`)
    if (req.body.name == undefined || typeof (req.body.name) !== "string")
        return res.status(400).send(`WrongRequest: Name is of wrong type, must be string. Recieved ${req.body.id} as param`)
    if (req.body.contact == undefined || typeof (req.body.contact) !== "string")
        return res.status(400).send(`WrongRequest: Contact is of wrong type, must be string. Recieved ${req.body.id} as param`)
    
    const foundCommunity = await community.findOne({communityID: req.body.id})
    if (foundCommunity !== null)
        return res.status(403).send(`DuplicateError: Community with duplicate ID found`)
    const createdCommunity = await community.create({
        communityID: parseInt(req.body.id),
        name: req.body.name,
        contact: req.body.contact
    })
    const communityApiKey = await authentication.create({
        communityID: parseInt(req.body.id),
        authToken: cryptoRandomString(128),
        allowedIPs: [],
    })
    res.status(200).json({community: createdCommunity, apiToken: communityApiKey.authToken})
})
router.post('/remove', async (req, res) => {
    const authenticated = await authUser(req)
    if (authenticated === 404)
        return res.status(404).send("AuthenticationError: API key is wrong")
    if (authenticated === 401)
        return res.status(410).send("AuthenticationError: IP adress whitelist mismatch")

    // check if ID is not a number
    if (req.body.id == undefined || isNaN(req.body.id))
        return res.status(400).send(`WrongRequest: ID is of wrong type, must be number. Recieved ${req.body.id} as param`)
    const removedCommunity = await community.deleteOne({communityID: req.body.id})
    res.status(200).json(removedCommunity)
})

module.exports = router
