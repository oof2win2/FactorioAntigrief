const mongoose = require("mongoose");

const ViolationModel = new mongoose.Schema({
    playername: String,
    admin: String,
    offenses: [Number],
})

module.exports = mongoose.model('Violations', ViolationModel)