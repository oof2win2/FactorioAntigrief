const AuthSchema = require("../database/fagc/authentication")
const CommunitySchema = require("../database/fagc/community")

module.exports = {
    getCommunity
}

async function getCommunity(api_key) {
    const auth = await AuthSchema.findOne({ api_key: api_key })
    return CommunitySchema.findById(auth.communityid)
}