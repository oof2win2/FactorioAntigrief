import { MongoMemoryServer } from "mongodb-memory-server"
import { config } from "./config"
import { watcher as communityWatcher } from "../../src/database/community"
import { watcher as categoryWatcher } from "../../src/database/category"
import { disconnect } from "./connect"

export default async function globalTeardown() {
	await communityWatcher.close()
	await categoryWatcher.close()
	await disconnect()
	if (config.Memory) {
		const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE
		await instance.stop()
	}
}
