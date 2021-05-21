const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const RuleSchema = new connection.Schema({
	readableid: String,
    shortdesc: String,
    longdesc: String,
})
RuleSchema.pre("save", function (next) {
	this.readableid = getUserStringFromID(this._id.toString())
	next()
})


module.exports = connection.model('Rules', RuleSchema)