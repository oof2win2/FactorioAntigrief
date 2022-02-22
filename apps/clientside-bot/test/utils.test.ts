import faker from "faker"
import { createFAGCId, createTimes, randomElementFromArray } from "./utils"

describe("createTimes", () => {
	it("Should run a function multiple times and give correct output", () => {
		const testFunction = () => 1
		const result = createTimes(testFunction, 3)
		expect(result).toEqual([1, 1, 1])
	})
	it("Should execute a function with parameters multiple times and give correct output", () => {
		const testFunction = (x: number) => x
		const result = createTimes(testFunction, [1], 3)
		expect(result).toEqual([1, 1, 1])
	})
	it("Should give some random numbers when using Math.random as the parameter function", () => {
		const result = createTimes(Math.random, [], 3)
		result.forEach((element, index) => {
			result.slice(index + 1).forEach((element2) => {
				expect(element).not.toEqual(element2)
			})
		})
	})
})

describe("createFAGCId", () => {
	it("Should create a 6 character long string", () => {
		const result = createFAGCId()
		expect(result.length).toBe(6)
	})
	it("Should make all characters alphanumerical", () => {
		const result = createFAGCId()
		expect(result).toMatch(/^[0-9a-zA-Z]+$/)
	})
})

describe("randomElementFromArray", () => {
	it("Should pick a random element from the array", () => {
		const array = [1, 2, 3]
		const result = randomElementFromArray(array)
		expect(array).toContain(result)
	})
	it("Should use Math.random for it's implementation", () => {
		jest.spyOn(Math, "random").mockImplementation(() => 0.01)
		const result = randomElementFromArray([1, 2, 3])
		expect(result).toBe(1)

		jest.spyOn(Math, "random").mockImplementation(() => 0.99) // Math.random returns a number between 0 and 1exclusive
		const result2 = randomElementFromArray([1, 2, 3])
		expect(result2).toBe(3)
	})
})

describe("randomElementsFromArray", () => {
	it("Should multiple random elements from the provided array", () => {
		// TODO: get an array of numbers and test with that
	})
})
