const mongoose = require("mongoose")

const RuleSchema = new mongoose.Schema({
    shortdesc: String,
    longdesc: String,
})

module.exports = mongoose.model('Rules', RuleSchema)