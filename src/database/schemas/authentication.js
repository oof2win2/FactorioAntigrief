const mongoose = require("mongoose");

const AuthModel = new mongoose.Schema({
    communityID: Number,
    authToken: String,
    allowedIPs: [String]
})

module.exports = mongoose.model('Authentication', AuthModel)