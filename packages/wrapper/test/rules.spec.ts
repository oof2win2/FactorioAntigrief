import { enableFetchMocks } from "jest-fetch-mock"
enableFetchMocks()
import { FAGCWrapper } from "../src/index"
import faker from "faker"
import "cross-fetch"
import { Rule } from "fagc-api-types"

const wrapper = new FAGCWrapper()

afterAll(() => wrapper.destroy())

const testRules: Rule[] = []
for (let i = 0; i < 10; i++) {
	testRules.push({
		id: faker.datatype.uuid(),
		shortdesc: faker.random.word(),
		longdesc: faker.random.words(),
	})
}

beforeEach(() => wrapper.rules.clearCache())
describe("Rules", () => {
	describe("fetchAll", () => {
		it("Should be able to fetch all rules", async () => {
			fetchMock.mockOnce(JSON.stringify(testRules))
			const rules = await wrapper.rules.fetchAll({})
	
			expect(rules.length).toBe(testRules.length)
			rules.map((rule, i) => {
				const originalRule = testRules[i]
				expect(rule.id).toBe(originalRule.id)
				expect(rule.shortdesc).toBe(originalRule.shortdesc)
				expect(rule.longdesc).toBe(originalRule.longdesc)
			})
		})
		it("Should cache a rule after fetching all", async () => {
			fetchMock.mockOnce(JSON.stringify(testRules))
			const rules = await wrapper.rules.fetchAll({})

			rules.map((rule) => {
				const resolved = wrapper.rules.resolveID(rule.id)
				expect(resolved).not.toBeNull()
				if (resolved !== null){
					expect(resolved.id).toBe(rule.id)
					expect(resolved.shortdesc).toBe(rule.shortdesc)
					expect(resolved.longdesc).toBe(rule.longdesc)
				}
			})
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.rules.fetchAll({})).rejects.toThrow()
		})
	})
	describe("fetch", () => {
		it("Should fetch a single rule correctly", async () => {
			fetchMock.mockOnce(JSON.stringify(testRules[0]))
			const originalRule = testRules[0]
			const rule = await wrapper.rules.fetchRule({ ruleid: originalRule.id })
			expect(rule).not.toBeNull()
			if (rule !== null && rule !== null) {
				expect(rule.id).toBe(originalRule.id)
				expect(rule.shortdesc).toBe(originalRule.shortdesc)
				expect(rule.longdesc).toBe(originalRule.longdesc)
			}
		})
		it("Should cache a rule after fetching it", async () => {
			fetchMock.mockOnce(JSON.stringify(testRules[0]))
			const rule = await wrapper.rules.fetchRule({ ruleid: testRules[0].id })

			expect(rule).not.toBeNull()
			const resolved = wrapper.rules.resolveID(rule!.id)
			expect(resolved).not.toBeNull()
			
			if (rule !== null && resolved !== null) {
				expect(resolved.id).toBe(rule.id)
				expect(resolved.shortdesc).toBe(rule.shortdesc)
				expect(resolved.longdesc).toBe(rule.longdesc)
			}
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.rules.fetchRule({ ruleid: testRules[0].id })).rejects.toThrow()
		})
	})
})