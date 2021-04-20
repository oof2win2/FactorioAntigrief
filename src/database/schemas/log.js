const mongoose = require("mongoose")

const LogSchema = new mongoose.Schema({
    timestamp: Date,
    api_key: String,
    ip: String,
    responseBody: Object,
    requestBody: Object,
    endpointAddress: String,
})

module.exports = mongoose.model('logs', LogSchema)