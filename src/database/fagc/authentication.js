const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const AuthSchema = new connection.Schema({
	communityId: {
		type: connection.Types.ObjectId,
		ref: "Communities"
	},
	api_key: String, // this is INTENTIONALLY api_key so they can be removed by mung
	allowed_ips: [String]
})

module.exports = connection.model("Authentication", AuthSchema)