const mongoose = require("mongoose")

const AuthSchema = new mongoose.Schema({
    communityName: String,
    apiKey: String,
    allowedIPs: [String]
})

module.exports = mongoose.model('Authentication', AuthSchema)