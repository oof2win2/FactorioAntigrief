const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const LogSchema = new connection.Schema({
	readableid: String,
    timestamp: Date,
    apikey: String,
    ip: String,
    responseBody: Object,
    requestBody: Object,
    endpointAddress: String,
})
LogSchema.pre("save", function (next) {
	this.readableid = getUserStringFromID(this._id.toString())
	next()
})

module.exports = connection.model('logs', LogSchema)