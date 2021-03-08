const mongoose = require("mongoose");

const OffenseModel = new mongoose.Schema({
    playername: String,
    admin: String
})

module.exports = mongoose.model('Offenses', OffenseModel)