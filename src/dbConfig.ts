import { ConnectOptions } from "mongoose"

// This file is NOT for private stuff, rather for database config

export interface ApiConfig {
	dbConnections: ConnectOptions[]
}
const config: ApiConfig = {
	dbConnections: [
		{
			dbName: "fagc",
		},
		{
			dbName: "bot",
		},
	],
}
export default config
