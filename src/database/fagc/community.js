const database = require("../database")
const { getUserStringFromID } = require("../../utils/functions-databaseless")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const CommunitySchema = new connection.Schema({
	readableid: String,
	name: String,
    contact: String,
	guildid: String,
})
CommunitySchema.pre("save", function (next) {
	this.readableid = getUserStringFromID(this._id.toString())
	next()
})

module.exports = connection.model('Communities', CommunitySchema)