import { createFDGLId, createTimes, randomElementFromArray } from "./utils"

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
		jest.spyOn(Math, "random")
			.mockReturnValueOnce(0.1)
			.mockReturnValueOnce(0.5)
			.mockReturnValueOnce(0.9)
		const result = createTimes(Math.random, [], 3)
		expect(result).toEqual([0.1, 0.5, 0.9])
	})
})

describe("createFDGLId", () => {
	it("Should create a 6 character long string", () => {
		const result = createFDGLId()
		expect(result.length).toBe(6)
	})
	it("Should make all characters alphanumerical", () => {
		const result = createFDGLId()
		expect(result).toMatch(/^[0-9a-zA-Z]+$/)
	})
})

describe("randomElementFromArray", () => {
	it("Should pick an element from the array", () => {
		const array = [1, 2, 3]
		const result = randomElementFromArray(array)
		expect(array).toContain(result)
	})
	it("Should use Math.random for it's implementation", () => {
		jest.spyOn(Math, "random").mockImplementation(() => 0.01)
		const result = randomElementFromArray([1, 2, 3])
		expect(result).toBe(1)

		jest.spyOn(Math, "random").mockImplementation(() => 0.99) // Math.random returns a number between 0 and 1 exclusive
		const result2 = randomElementFromArray([1, 2, 3])
		expect(result2).toBe(3)
	})
})

// describe("randomElementsFromArray", () => {
// 	it("Should multiple random elements from the provided array", () => {
// 		// TODO: get an array of numbers and test with that
// 	})
// })
