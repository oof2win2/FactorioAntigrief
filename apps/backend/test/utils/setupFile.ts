import { connect, disconnect } from "./connect"
import CommunityModel, {
	watcher as communityWatcher,
} from "../../src/database/community"
import CategoryModel, {
	watcher as categoryWatcher,
} from "../../src/database/category"
import { createCategories } from "../utils"
import backend from "../../src/app"
import FilterModel from "../../src/database/filterobject"
import mongoose from "mongoose"
import { setTestCategories, setTestCommunity } from "./initialData"

beforeAll(async () => {
	await connect()
	// Insert test data
	const filterObject = await FilterModel.create({})
	const testCommunity = await CommunityModel.create({
		name: "Test Community",
		contact: "12345",
		filterObjectId: filterObject.id,
	})
	const testCategories = await CategoryModel.create(createCategories(3))
	setTestCategories(testCategories)
	setTestCommunity(testCommunity)
	await backend.listen(0)
})

afterAll(async () => {
	// Watchers throw when disconnecting for some reason
	await communityWatcher.close()
	await categoryWatcher.close()

	for (const collection of Object.values(mongoose.connection.collections)) {
		await collection.deleteMany({})
	}

	await disconnect()
}, 20e3)
;(global as any).__backend = backend
