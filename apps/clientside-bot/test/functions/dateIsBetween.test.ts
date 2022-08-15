import dateIsBetween from "../../src/utils/functions/dateIsBetween"

describe("dateIsBetween", () => {
	it("Should return true if a date is between two dates", () => {
		const d1 = new Date("2020-01-01")
		const d2 = new Date("2020-01-03")
		const test = new Date("2020-01-02")

		expect(dateIsBetween(test, d1, d2)).toBe(true)
	})

	it("Should return true if the date is the same as the start date", () => {
		const d1 = new Date("2020-01-01")
		const d2 = new Date("2020-01-03")
		const test = new Date("2020-01-01")

		expect(dateIsBetween(test, d1, d2)).toBe(true)
	})

	it("Should return true if the date is the same as the end date", () => {
		const d1 = new Date("2020-01-01")
		const d2 = new Date("2020-01-03")
		const test = new Date("2020-01-03")

		expect(dateIsBetween(test, d1, d2)).toBe(true)
	})
})
