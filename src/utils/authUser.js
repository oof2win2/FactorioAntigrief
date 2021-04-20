const authentication = require("../database/schemas/authentication")

/**
 * @description Checks the authentication of a user by searching the database with the API key
 * @param {express.Request} - Request to the API 
 * @returns {Number} - 200 if OK, 401 if wrong IP, 404 if key not found / doesn't belong to anyone
 */
const authenticate = async (req) => {
    if (req.method === 'GET') return 200
    if (req.headers.apikey === undefined) return 404 // no api key
    const dbRes = await authentication.findOne({api_key: req.headers.apikey})
    if (dbRes === undefined || dbRes === null) return 404 // API key not found

    // api key is now confirmed to be correct

    // if whitelisted IPs are set. will have issues with IPv6 adresses since they have semicolons in them
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    if (dbRes.allowed_ips[0] == undefined) return 200
    else if (dbRes.allowed_ips.includes(ip)) return 200 // API key is correct and IP adress is correct
    return 401  // API key is correct, but wrong IP adress
}

module.exports = authenticate