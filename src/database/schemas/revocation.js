const mongoose = require("mongoose")

const RevocationSchema = new mongoose.Schema({
    playername: String,
    adminname: String,
    communityname: String,
    brokenRule: mongoose.SchemaTypes.ObjectId,
    proof: String,
    description: String,
    automated: Boolean,
    violatedTime: Date,
    revokedTime: Date,
    revokedBy: String
})

module.exports = mongoose.model('Revocations', RevocationSchema)