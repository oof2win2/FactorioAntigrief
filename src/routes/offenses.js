const express = require('express');
const router = express.Router();
const OffenseModel = require("../database/schemas/offense");
const { getCommunity } = require('../utils/functions');


/* GET home page. */
router.get('/', function (req, res) {
    res.send('Offenses API Homepage!')
})
router.get('/offense', async (req, res) => {
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
        return res.status(400).send(`Bad Request: playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`)
    if (req.body.communityname === undefined || typeof (req.body.communityname) !== 'string')
        return res.status(400).send(`Bad Request: communityname expected string, got ${typeof (req.body.communityname)} with value of ${req.body.communityname}`)
    
    const offense = await OffenseModel.findOne({
        playername: req.body.playername,
        communityname: req.body.communityname,
    })
    res.status(200).json(offense)
})
router.get('/offense', async (req, res) => {
    if (req.body.id === undefined || isNaN(req.body.id))
        return res.status(400).send(`Bad Request: id expected number, got ${typeof (req.body.id)} with value of ${req.body.id}`)
    const offense = await OffenseModel.findById(req.body.id)
    res.status(200).json(offense)
})
router.post('/revoke', async (req, res) => {
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
        return res.status(400).send(`Bad Request: playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`)
    if (req.body.adminname === undefined || typeof (req.body.adminname) !== 'string')
        return res.status(400).send(`Bad Request: adminname expected string, got ${typeof (req.body.adminname)} with value of ${req.body.adminname}`)
    if (req.body.communityname === undefined || typeof (req.body.communityname) !== 'string')
        return res.status(400).send(`Bad Request: communityname expected string, got ${typeof (req.body.communityname)} with value of ${req.body.communityname}`)
    const toRevoke = await OffenseModel.findOne({
        playername: req.body.playername,
        communityname: req.body.communityname
    })
    const community = await getCommunity(req.headers.apikey)
    if (toRevoke.communityname !== community.communityname)
        return res.status(403).send(`Access Denied: Belongs to community ${toRevoke.communityname} whilst you are ${community.communityname}`)
    const revocation = await OffenseModel.findByIdAndDelete(toRevoke._id)
    return revocation
})

module.exports = router