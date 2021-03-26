const AuthSchema = require("../database/schemas/authentication")

module.exports = {
    getCommunity
}

async function getCommunity(apiKey) {
    const dbRes = await AuthSchema.findOne({ apiKey: apiKey })
    return dbRes
}