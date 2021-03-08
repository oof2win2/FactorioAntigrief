const mongoose = require("mongoose");

const RuleModel = new mongoose.Schema({
    shortdesc: String,
    longdesc: String,
})

module.exports = mongoose.model('Rules', RuleModel)