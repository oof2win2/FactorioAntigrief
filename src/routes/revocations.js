const express = require('express');
const router = express.Router();
const RevocationModel = require("../database/schemas/revocation")

router.get('/getrevocations', async (req, res) => {
    if (req.body.playername === undefined || typeof (req.body.playername) !== 'string')
        return res.status(400).send(`Bad Request: playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`)
    if (req.body.communityname === undefined || typeof (req.body.communityname) !== 'string')
        return res.status(400).send(`Bad Request: communityname expected string, got ${typeof (req.body.communityname)} with value of ${req.body.communityname}`)
    let revocation = await RevocationModel.find({
        playername: req.body.playername,
        communityname: req.body.communityname
    })
    return res.status(200).send(revocation)
})
module.exports = router