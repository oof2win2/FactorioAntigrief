const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const CommunitySchema = new connection.Schema({
    name: String,
    contact: String,
	guildid: String,
})

module.exports = connection.model('Communities', CommunitySchema)