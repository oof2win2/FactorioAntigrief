const mongoose = require("mongoose");

const CommunityModel = new mongoose.Schema({
    id: Number,
    name: String,
    info: String
})

module.exports = mongoose.model('Communities', CommunityModel)