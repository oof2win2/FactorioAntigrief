import { enableFetchMocks } from "jest-fetch-mock"
enableFetchMocks()
import { FAGCWrapper } from "../src/index"
import "cross-fetch"
import { createRule } from "./util"

const wrapper = new FAGCWrapper({
	masterapikey: "x",
	apikey: "x",
})

const testRules = Array(50).fill(0).map(() => createRule())

afterAll(() => wrapper.destroy())

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

	describe("create", () => {
		it("Should create a single rule correctly", async () => {
			const testRule = testRules[0]
			fetchMock.mockOnce(JSON.stringify(testRule))
			const rule = await wrapper.rules.create({
				rule: {
					shortdesc: testRule.shortdesc,
					longdesc: testRule.longdesc,
				}
			})
			
			expect(rule.id).toBe(testRule.id)
			expect(rule.shortdesc).toBe(testRule.shortdesc)
			expect(rule.longdesc).toBe(testRule.longdesc)
		})
		it("Should cache a rule after creating it", async () => {
			const testRule = testRules[0]
			fetchMock.mockOnce(JSON.stringify(testRule))
			const rule = await wrapper.rules.create({
				rule: {
					shortdesc: testRule.shortdesc,
					longdesc: testRule.longdesc,
				}
			})
			
			const resolved = wrapper.rules.resolveID(rule.id)
			expect(resolved).not.toBeNull()
			if (resolved !== null) {
				expect(resolved.id).toBe(rule.id)
				expect(resolved.shortdesc).toBe(rule.shortdesc)
				expect(resolved.longdesc).toBe(rule.longdesc)
			}
			
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.rules.create({
				rule: {
					shortdesc: "test",
					longdesc: "test",
				}
			})).rejects.toThrow()
		})
	})
	
	describe("fetchRule", () => {
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

	describe("modify", () => {
		it("Should return a valid rule that is modified", async () => {
			const testRule = testRules[0]

			const newRule = {
				id: testRule.id,
				shortdesc: testRule.shortdesc + "test",
				longdesc: testRule.longdesc + "test",
			}
			fetchMock.mockOnce(JSON.stringify(newRule))
			const returned = await wrapper.rules.modify({
				ruleId: testRule.id,
				shortdesc: newRule.shortdesc,
				longdesc: newRule.longdesc,
			})
			expect(returned).not.toBeNull()
			if (returned !== null) {
				expect(returned.id).toBe(testRule.id)
				expect(returned.shortdesc).toBe(newRule.shortdesc)
				expect(returned.longdesc).toBe(newRule.longdesc)
			}
		})
		it("Should cache returned rule and not have only new version of rule in cache", async () => {
			const testRule = testRules[0]
			wrapper.rules.cache.set(testRule.id, testRule) // set it in the cache
			
			const oldCached = wrapper.rules.resolveID(testRule.id)

			const newRule = {
				id: testRule.id,
				shortdesc: testRule.shortdesc + "test",
				longdesc: testRule.longdesc + "test",
			}
			fetchMock.mockOnce(JSON.stringify(newRule))
			const returned = await wrapper.rules.modify({
				ruleId: testRule.id,
				shortdesc: newRule.shortdesc,
				longdesc: newRule.longdesc,
			})
			console.log(returned, newRule)
			expect(returned).not.toBeNull()

			const newCached = wrapper.rules.resolveID(testRule.id)

			if (returned !== null && newCached !== null && oldCached !== null) {
				// check if the returned rule is correct
				expect(returned.id).toBe(testRule.id)
				expect(returned.shortdesc).toBe(newRule.shortdesc)
				expect(returned.longdesc).toBe(newRule.longdesc)
				
				// check if the old rule is different from the new one
				expect(returned.shortdesc).toBe(oldCached.shortdesc + "test")
				expect(returned.longdesc).toBe(oldCached.longdesc + "test")

				// check if the cached rule is the same as the returned one
				expect(newCached.id).toBe(returned.id)
				expect(newCached.shortdesc).toBe(returned.shortdesc)
				expect(newCached.longdesc).toBe(returned.longdesc)
			}
		})
	})
})