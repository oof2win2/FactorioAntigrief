const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const CommunitySchema = new connection.Schema({
	id: String,
	name: String,
	contact: String,
	guildid: String,
})
CommunitySchema.pre("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})

module.exports = connection.model("Communities", CommunitySchema)