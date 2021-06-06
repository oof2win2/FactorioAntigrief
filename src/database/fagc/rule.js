const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const RuleSchema = new connection.Schema({
	id: String,
	shortdesc: String,
	longdesc: String,
})
RuleSchema.pre("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})


module.exports = connection.model("Rules", RuleSchema)