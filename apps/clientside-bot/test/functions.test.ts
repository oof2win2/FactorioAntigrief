import { splitIntoGroups } from "../src/utils/functions"

describe("splitIntoGroups", () => {
	it("Should split a large array two smaller ones of an equal size", () => {
		const items = new Array(1000).fill(0)
		const groups = splitIntoGroups(items, 500)
		expect(groups.length).toBe(2)
		expect(groups[0].length).toBe(500)
		expect(groups[1].length).toBe(500)
	})
	it("Should split a large array into multiple smaller ones if a smaller maxSize is provided", () => {
		const items = new Array(1000).fill(0)
		const groups = splitIntoGroups(items, 100)
		expect(groups.length).toBe(10)
		for (const group of groups) {
			expect(group.length).toBe(100)
		}
	})
	it("Should keep the original values of the inital array", () => {
		const items = Array.from({ length: 1000 }, () =>
			Math.floor(Math.random() * 10)
		)
		const groups = splitIntoGroups(items, 100)
		expect(groups.flat()).toEqual(items)
	})
})
