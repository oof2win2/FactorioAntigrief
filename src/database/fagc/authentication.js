const database = require("../database")
const connection = database.connections.find((connection) => connection.n === "fagc").c

const AuthSchema = new connection.Schema({
    communityname: String,
    api_key: String,
    allowed_ips: [String]
})

module.exports = connection.model('Authentication', AuthSchema)