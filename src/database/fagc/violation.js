const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const ViolationSchema = new connection.Schema({
    playername: String,
	communityid: {
		type: connection.Types.ObjectId,
		ref: "Communities"
	},
	broken_rule: connection.SchemaTypes.ObjectId,
    proof: String,
    description: String,
    automated: Boolean,
    violated_time: Date,
    admin_id: String,
})

module.exports = connection.model('Violations', ViolationSchema)