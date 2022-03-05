import { generateId } from "../../src/common/utils"

describe("generateId", () => {
	it("Should generate an ID of a set length", () => {
		const id = generateId(512)
		expect(id.length).toBe(512)
	})
	it("Should make the IDs fairly unique, none should repeat with a length of 12 in a list of 1 million", () => {
		// should take about 2s to run
		const ids: string[] = []
		for (let i = 0; i < 10e5; i++) {
			ids.push(generateId(12))
		}
		expect(new Set(ids).size).toBe(10e5)
	})
})
