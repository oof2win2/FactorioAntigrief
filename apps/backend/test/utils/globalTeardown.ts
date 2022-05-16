import { MongoMemoryServer } from "mongodb-memory-server"
import { config } from "./config"
import { disconnect } from "./connect"

export default async function globalTeardown() {
	await disconnect()
	if (config.Memory) {
		const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE
		await instance.stop()
	}
}
