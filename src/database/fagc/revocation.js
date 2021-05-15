const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const RevocationSchema = new connection.Schema({
    playername: String,
    admin_name: String,
	communityid: {
		type: connection.Types.ObjectId,
		ref: "Communities"
	},
	broken_rule: connection.SchemaTypes.ObjectId,
    proof: String,
    description: String,
    automated: Boolean,
    violated_time: Date,
    revokedTime: Date,
    revokedBy: String
})

module.exports = connection.model('Revocations', RevocationSchema)