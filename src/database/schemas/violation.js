const mongoose = require("mongoose")

const ViolationSchema = new mongoose.Schema({
    playername: String,
    communityname: String,
    brokenRule: mongoose.SchemaTypes.ObjectId,
    proof: String,
    description: String,
    automated: Boolean,
    violatedTime: Date,
    adminname: String,
})

module.exports = mongoose.model('Violations', ViolationSchema)