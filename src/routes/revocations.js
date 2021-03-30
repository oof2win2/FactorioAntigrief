const express = require('express');
const router = express.Router();
const RevocationModel = require("../database/schemas/revocation")

router.get('/getrevocations', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
    if (req.query.communityname === undefined || typeof (req.query.communityname) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `communityname expected string, got ${typeof (req.body.communityname)} with value of ${req.body.communityname}`})
    let revocations = await RevocationModel.find({
        playername: req.query.playername,
        communityname: req.query.communityname
    })
    return res.status(200).json(revocations)
})
router.get('/getallrevocations', async (req, res) => {
    if (req.query.playername === undefined || typeof (req.query.playername) !== 'string')
        return res.status(400).json({ error: "Bad Request", description: `playername expected string, got ${typeof (req.body.playername)} with value of ${req.body.playername}`})
    let revocations = await RevocationModel.find({
        playername: req.query.playername
    })
    return res.status(200).json(revocations)
})
module.exports = router