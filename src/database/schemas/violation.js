const mongoose = require("mongoose")

const ViolationSchema = new mongoose.Schema({
    playername: String,
    communityname: String,
    brokenRule: Number,
    proof: String,
    description: String,
    automated: Boolean,
    violatedTime: Date,
    adminname: String,
})

module.exports = mongoose.model('Violations', ViolationSchema)