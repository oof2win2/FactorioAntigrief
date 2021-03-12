const mongoose = require("mongoose")

const WebhookSchema = new mongoose.Schema({
    apiKey: String,
    id: String,
    token: String,
    level: Number,
})

module.exports = mongoose.model('webhooks', WebhookSchema)