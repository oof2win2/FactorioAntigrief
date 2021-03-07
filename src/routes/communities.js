const express = require('express');
const router = express.Router();
const community = require("../database/schemas/community")

/* GET home page. */
router.get('/', function (req, res) {
    res.send('Community API Homepage!')
})
router.get('/getID', async (req, res) => {
    console.log(req.query)
    if (req.query.id == undefined || !Number.isInteger(parseInt(req.query.id))) return res.status(404).json({
        "WrongRequest": `CommunityID is of wrong type, must be number. Recieved ${req.query.id} as param`
    })
    const dbRes = await community.findOne({ id: parseInt(req.query.id) })
    res.status(200).json(dbRes)
})
router.get('/getName', async (req, res) => {
    if (req.query.name == undefined || typeof (req.query.name) !== "string") return res.status(404).json({
        "WrongRequest": `CommunityName is of wrong type, must be string. Recieved ${req.query.id} as param`
    })
    const dbRes = await community.findOne({ name: req.query.name });
    res.status(200).json(dbRes);
})

module.exports = router;
