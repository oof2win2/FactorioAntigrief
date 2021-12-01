import { ConnectOptions } from "mongoose"
import ENV from "./utils/env.js"

// This file is NOT for private stuff, rather for database config

export interface ApiConfig {
	dbConnections: ConnectOptions[]
}
const config: ApiConfig = {
	dbConnections: [
		{
			dbName: ENV.BACKENDDBNAME,
		},
		{
			dbName: ENV.BOTDBNAME,
		},
	],
}
export default config
