const mongoose = require("mongoose")

const AuthSchema = new mongoose.Schema({
    communityname: String,
    api_key: String,
    allowed_ips: [String]
})

module.exports = mongoose.model('Authentication', AuthSchema)