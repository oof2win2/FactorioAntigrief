import CategoryModel from "../src/database/category"
import backend from "./prepareTest"
import * as mockingoose from "mockingoose"
import { createCategories } from "./utils"

describe("GET /categories/", () => {
	it("Should fetch all categories and return them correctly", async () => {
		const fetchedData = createCategories(10)
		mockingoose(CategoryModel).toReturn(fetchedData, "find")
		const response = await backend.inject({
			path: "/categories",
			method: "GET"
		})
		expect(response.statusCode).toBe(200)
		const backendData = await response.json()
		expect(backendData.length).toBe(fetchedData.length)
		fetchedData.map((fetchedCategory, i) => {
			const backendCategory = backendData[i]
			expect(backendCategory).toEqual(fetchedCategory)
		})
	})
})