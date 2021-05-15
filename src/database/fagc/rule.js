const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const RuleSchema = new connection.Schema({
    shortdesc: String,
    longdesc: String,
})

module.exports = connection.model('Rules', RuleSchema)