const express = require('express')
const router = express.Router()
// const cryptoRandomString = require('crypto-random-string')
// const community = require("../database/schemas/community")
// const authentication = require("../database/schemas/authentication")
const authUser = require("../utils/authUser")
const offenses = require("../database/schemas/offenses")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.get('/getID', async (req, res) => {
    if (req.body.id == undefined || !Number.isInteger(parseInt(req.body.id)))
        return res.status(400).send(`WrongRequest: ID is of wrong type, must be number. Recieved ${req.body.id} as param`)
    const dbRes = await offenses.findOne({ offenseID: parseInt(req.body.id) })
    res.status(200).json(dbRes)
})
router.post('/revoke', async (req, res) => {
    if (req.body.id == undefined || !Number.isInteger(parseInt(req.body.id)))
        return res.status(400).send(`WrongRequest: ID is of wrong type, must be number. Recieved ${req.body.id} as param`)
    if (req.body.admin == undefined || typeof(req.body.admin) !== "string")
        return res.status(400).send(`WrongRequest: admin is of wrong type, must be string. Recieved ${req.body.admin} as param`)
    
    const authenticated = await authUser(req)
    if (authenticated === 404)
        return res.status(404).send("AuthenticationError: API key is wrong")
    if (authenticated === 401)
        return res.status(410).send("AuthenticationError: IP adress whitelist mismatch")
    
    const dbRes = offenses.deleteOne({ offenseID: req.body.id })
    res.status(200).json(dbRes)
})

module.exports = router
