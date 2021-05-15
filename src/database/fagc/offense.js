const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const OffenseModel = new connection.Schema({
    playername: String,
    communityname: String,
	violations: [{ type: connection.Types.ObjectId, ref: 'Violations' }]
})

module.exports = connection.model('Offenses', OffenseModel)