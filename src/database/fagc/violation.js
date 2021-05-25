const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const ViolationSchema = new connection.Schema({
	id: String,
    playername: String,
	communityid: String,
	broken_rule: String,
    proof: String,
    description: String,
    automated: Boolean,
    violated_time: Date,
    admin_id: String,
})
ViolationSchema.pre("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})

module.exports = connection.model('Violations', ViolationSchema)