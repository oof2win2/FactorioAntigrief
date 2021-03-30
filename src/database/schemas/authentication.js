const mongoose = require("mongoose")

const AuthSchema = new mongoose.Schema({
    communityname: String,
    apiKey: String,
    allowedIPs: [String]
})

module.exports = mongoose.model('Authentication', AuthSchema)