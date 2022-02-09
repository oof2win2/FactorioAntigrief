import { MongoMemoryReplSet } from "mongodb-memory-server"
import mongoose from "mongoose"
import CommunityModel, { CommunityClass, watcher as communityWatcher } from "../src/database/community"
import CategoryModel, { CategoryClass, watcher as categoryWatcher } from "../src/database/category"
import { createCategories } from "./utils"
import backend from "../src/app"


let mongod: MongoMemoryReplSet
export let testCommunity: CommunityClass
export let testCategories: CategoryClass[]
beforeAll(async () => {
	// ephemeralForTest does not support change streams
	mongod = await MongoMemoryReplSet.create({ instanceOpts: [ { storageEngine: "wiredTiger" } ] })
	await mongoose.connect(mongod.getUri(), { ignoreUndefined: true })
	
	// Insert test data
	testCommunity = await CommunityModel.create({ name: "Test Community", contact: "12345" })
	testCategories = await CategoryModel.create(createCategories(3))
	await backend.listen(0)
// TODO: reduce to 20s once MongoMemoryReplSet takes less time to startup
}, 60e3)

afterAll(async () => {
	// Watchers throw when disconnecting for some reason
	await communityWatcher.close()
	await categoryWatcher.close()

	await backend.close()
	await mongoose.disconnect()
	await mongod.stop()
}, 20e3)

export { default as backend } from "../src/app"
