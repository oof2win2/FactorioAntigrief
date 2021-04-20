const AuthSchema = require("../database/schemas/authentication")

module.exports = {
    getCommunity
}

async function getCommunity(api_key) {
    const dbRes = await AuthSchema.findOne({ api_key: api_key })
    return dbRes
}