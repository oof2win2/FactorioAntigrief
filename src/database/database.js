const { Mongoose } = require("mongoose")
// const mongoose = require("mongoose")
// const mongodb = require("mongo-mock")
const config = require("../../config")

class ConnectionManager {
	constructor(config) {
		this.connections = config.dbConnections.map((connectionConfig) => {
			let connection = new Mongoose()
			connection.connect(config.mongoURI, connectionConfig).then(() => {
				console.log(`Database ${connectionConfig.dbName} connected!`)
			}).catch((e) => {
				console.error(`Database ${connectionConfig.dbName} errored: ${e}`)
			})
			return {
				c: connection,
				n: connectionConfig.dbName
			}
		})
	}
}
module.exports = new ConnectionManager(config)