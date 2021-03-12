const express = require('express');
const router = express.Router();
const ViolationModel = require("../database/schemas/violation")
const RevocationModel = require("../database/schemas/revocation")
const { violationRevokedMessage } = require("../utils/functions");

router.post('/revoke', async (req, res) => {
    // console.log(req.body)
    if (req.body.violationid === undefined || typeof (req.body.violationid) !== "string")
        return res.status(400).send(`Bad Request: violationid expected string, got ${typeof (req.body.violationid)} with value of ${req.body.violationid}`)
    if (req.body.adminname === undefined || typeof(req.body.adminname) !== 'string')
        return res.status(400).send(`Bad Request: adminname expected string, got ${typeof (req.body.adminname)} with value of ${req.body.adminname}`)
    let violation = await ViolationModel.findByIdAndDelete(req.body.violationid)
    if (violation === null || violation === undefined)
        return res.status(404).send(`404 Not Found: Violation with ID ${req.body.violationid} not found`)
    console.log(violation)
    violation.RevokedTime = new Date()
    violation.revokedby = req.body.adminname
    violation._id = undefined
    violation.__v = undefined
    const revocation = await RevocationModel.create(violation)
    violationRevokedMessage(revocation)
    return res.status(200).send(revocation)
})
router.post('/revokeall', async (req, res) => {
    
})
module.exports = router