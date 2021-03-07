const mongoose = require("mongoose");

const RuleModel = new mongoose.Schema({
    id: Number,
    shortdesc: String,
    longdesc: String,
})

module.exports = mongoose.model('Rules', RuleModel)