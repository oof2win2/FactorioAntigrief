const express = require("express")
const mongoose = require("mongoose");

const LogModel = new mongoose.Schema({
    apiKey: String,
    ip: String,
    timestamp: Date,
    query: express.request.query,
    response: express.response,
})

module.exports = mongoose.model('Logs', LogModel)