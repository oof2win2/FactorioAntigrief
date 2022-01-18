import RuleModel from "../src/database/rule"
import backend from "./prepareTest"
import * as mockingoose from "mockingoose"
import { createRules } from "./utils"

describe("GET /rules/", () => {
	it("Should fetch all rules and return them correctly", async () => {
		const fetchedData = createRules(10)
		mockingoose(RuleModel).toReturn(fetchedData, "find")
		const response = await backend.inject({
			path: "/rules",
			method: "GET"
		})
		expect(response.statusCode).toBe(200)
		const backendData = await response.json()
		expect(backendData.length).toBe(fetchedData.length)
		fetchedData.map((fetchedRule, i) => {
			const backendRule = backendData[i]
			expect(backendRule).toEqual(fetchedRule)
		})
	})
})