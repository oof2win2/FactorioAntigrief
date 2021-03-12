const express = require('express');
const router = express.Router();
const ViolationModel = require("../database/schemas/violation")
const OffenseModel = require("../database/schemas/offense");
const RevocationModel = require('../database/schemas/revocation');


/* GET home page. */
router.get('/', function (req, res) {
    res.send('Violations API Homepage!')
})
router.post('/reset', async (req, res) => {
    const res1 = await ViolationModel.deleteMany()
    const res2 = await OffenseModel.deleteMany()
    const res3 = await RevocationModel.deleteMany()
    // console.log(res1, res2)
    res.status(200).send("Done!")
})

module.exports = router