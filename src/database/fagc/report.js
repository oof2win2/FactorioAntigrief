const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const ReportSchema = new connection.Schema({
	id: String,
	playername: String,
	communityId: String,
	brokenRule: String,
	proof: String,
	description: String,
	automated: Boolean,
	reportedTime: Date,
	adminId: String,
})
ReportSchema.pre("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})

module.exports = connection.model("Reports", ReportSchema)