const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const OffenseModel = new connection.Schema({
	readableid: String,
    playername: String,
    communityid: String,
	violations: [{ type: connection.Types.ObjectId, ref: 'Violations' }] // This is internal. Will always be populated in the API, doesn't make sense why it wouldn't
})
OffenseModel.pre("save", function (next) {
	this.readableid = getUserStringFromID(this._id.toString())
	next()
})

module.exports = connection.model('Offenses', OffenseModel)