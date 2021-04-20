const mongoose = require("mongoose")

const RevocationSchema = new mongoose.Schema({
    playername: String,
    admin_name: String,
    communityname: String,
    broken_rule: mongoose.SchemaTypes.ObjectId,
    proof: String,
    description: String,
    automated: Boolean,
    violated_time: Date,
    revokedTime: Date,
    revokedBy: String
})

module.exports = mongoose.model('Revocations', RevocationSchema)