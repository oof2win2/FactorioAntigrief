import { ConnectionOptions } from "mongoose"

// This file is NOT for private stuff, rather for database config

export interface ApiConfig {
	dbConnections: ConnectionOptions[]
}
const config: ApiConfig = {
	dbConnections: [
		{
			dbName: "fagc",
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
		},
		{
			dbName: "bot",
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
		},
	],
}
export default config
