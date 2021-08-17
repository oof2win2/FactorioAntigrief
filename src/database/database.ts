import mongoose from "mongoose"
const {Mongoose} = mongoose
import config, { ApiConfig } from "../config.js"
import ENV from "../utils/env.js"

class ConnectionManager {
	connections: ({
		c: typeof import("mongoose")
		n: string
	} | undefined)[]
	constructor(config: ApiConfig) {
		this.connections = config.dbConnections.map((connectionConfig) => {
			try {
				const connection = new Mongoose()
				connection.connect(ENV.MONGOURI, connectionConfig).then(() => {
					console.log(`Database ${connectionConfig.dbName} connected!`)
				}).catch((e: unknown) => {
					console.error(`Database ${connectionConfig.dbName} errored: ${e}`)
				})
				return {
					c: connection,
					n: connectionConfig.dbName as string
				}
			} catch (e) {
				console.error(`Database ${connectionConfig.dbName} errored: ${e}`)
			}
		})
	}
}
export default new ConnectionManager(config)