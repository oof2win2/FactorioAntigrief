import { CommunityClass } from "../../src/database/community"
import { CategoryClass } from "../../src/database/category"

export let testCommunity: CommunityClass
export let testCategories: CategoryClass[]

export const setTestCommunity = (x: CommunityClass) => {
	testCommunity = x
}
export const setTestCategories = (x: CategoryClass[]) => {
	testCategories = x
}
