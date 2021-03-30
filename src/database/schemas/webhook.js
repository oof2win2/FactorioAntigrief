const mongoose = require("mongoose")

const WebhookSchema = new mongoose.Schema({
    apiKey: String,
    id: String,
    token: String,
})

module.exports = mongoose.model('webhooks', WebhookSchema)