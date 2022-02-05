import { backend, testCategories } from "./prepareTest"
import { toJson } from "./utils"

describe("GET /categories/", () => {
	it("Should fetch all categories and return them correctly", async () => {
		const response = await backend.inject({
			method: "GET",
			path: "/categories",
		})
		expect(response.statusCode).toBe(200)
		const backendData = response.json()
		expect(backendData).toEqual(testCategories.map(toJson))
	})
})