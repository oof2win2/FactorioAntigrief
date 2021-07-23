import { ConnectionOptions } from "mongoose"

export interface ApiConfig {
	dbConnections: ConnectionOptions[]
}
const config: ApiConfig = {
	dbConnections: [
		{
			dbName: "fagc",
			useNewUrlParser: true,
			useUnifiedTopology: true,
		},
		{
			dbName: "bot",
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}
	]
}
export default config