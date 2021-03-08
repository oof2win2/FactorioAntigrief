const mongoose = require("mongoose");

const AuthModel = new mongoose.Schema({
    authToken: String,
    allowedIPs: [String]
})

module.exports = mongoose.model('Authentication', AuthModel)