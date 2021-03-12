const mongoose = require("mongoose")

const RevocationSchema = new mongoose.Schema({
    playername: String,
    adminname: String,
    communityname: String,
    brokenRules: Number,
    proof: String,
    description: String,
    automated: Boolean,
    ViolatedTime: Date,
    RevokedTime: Date,
    revokedBy: String
})

module.exports = mongoose.model('Revocations', RevocationSchema)