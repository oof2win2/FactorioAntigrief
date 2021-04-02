const mongoose = require("mongoose")

const WebhookSchema = new mongoose.Schema({
    id: String,
    token: String,
    guildid: String,
})

module.exports = mongoose.model('webhooks', WebhookSchema)