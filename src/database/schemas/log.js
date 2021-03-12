const mongoose = require("mongoose")

const LogSchema = new mongoose.Schema({
    timestamp: Date,
    apiKey: String,
    ip: String,
    responseBody: Object,
    requestBody: Object,
})

module.exports = mongoose.model('logs', LogSchema)