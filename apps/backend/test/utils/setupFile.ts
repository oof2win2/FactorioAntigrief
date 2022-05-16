import { connect, disconnect } from "./connect"
import CommunityModel from "../../src/database/community" // watcher as communityWatcher,
import CategoryModel from "../../src/database/category" // watcher as categoryWatcher,
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
	setTestCategories(testCategories.map((category) => category.toObject()))
	setTestCommunity(testCommunity.toObject())
	await backend.listen(0)
}, 20e3)

afterAll(async () => {
	for (const collection of Object.values(mongoose.connection.collections)) {
		await collection.deleteMany({})
	}
	await disconnect()
}, 20e3)
;(global as any).__backend = backend
