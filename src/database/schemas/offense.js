const mongoose = require("mongoose")

const OffenseModel = new mongoose.Schema({
    playername: String,
    communityname: String,
    violations: [{ type: mongoose.Types.ObjectId, ref: 'Violations' }]
})

module.exports = mongoose.model('Offenses', OffenseModel)