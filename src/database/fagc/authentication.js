const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const AuthSchema = new connection.Schema({
	communityid: {
		type: connection.Types.ObjectId,
		ref: 'Communities'
	},
    api_key: String,
    allowed_ips: [String]
})

module.exports = connection.model('Authentication', AuthSchema)