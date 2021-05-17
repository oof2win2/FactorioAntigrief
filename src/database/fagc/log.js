const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const LogSchema = new connection.Schema({
    timestamp: Date,
    apikey: String,
    ip: String,
    responseBody: Object,
    requestBody: Object,
    endpointAddress: String,
})

module.exports = connection.model('logs', LogSchema)