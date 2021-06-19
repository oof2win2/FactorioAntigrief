const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const RevocationSchema = new connection.Schema({
	id: String,
	playername: String,
	adminId: String,
	communityId: String,
	brokenRule: String,
	proof: String,
	description: String,
	automated: Boolean,
	reportedTime: Date,
	revokedTime: Date,
	revokedBy: String
})
RevocationSchema.pre("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})

module.exports = connection.model("Revocations", RevocationSchema)