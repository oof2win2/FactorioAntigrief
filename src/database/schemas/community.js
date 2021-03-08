const mongoose = require("mongoose");

const CommunityModel = new mongoose.Schema({
    name: String,
    contact: String
})

module.exports = mongoose.model('Communities', CommunityModel)