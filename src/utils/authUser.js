const mongoose = require("mongoose");
const authentication = require("../database/schemas/authentication")


const authenticate = async (req) => {
    const ipv4_regex = new RegExp(/((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)((^|\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){2})(^|\.(25[0-4]|2[0-4]\d|1\d\d|[1-9]\d|[1-9])))|(0\.0\.0\.0)/)
    const dbRes = await authentication.findOne({authToken: req.headers.apikey});
    if (dbRes === undefined || dbRes === null) return false
    else if (dbRes.authToken !== req.headers.apikey) return false

    // if whitelisted IPs are set. will have issues with IPv6 adresses like 99% since they have a :
    const ip = req.get('host').slice(0, req.get('host').indexOf(":"))
    if (dbRes.allowedIPs[0] == undefined) return true
    else if (dbRes.allowedIPs.includes(ip)) return true
    return false
}

module.exports = authenticate