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
				expect(rule).toEqual(originalRule)
			})
		})
		it("Should cache a rule after fetching all", async () => {
			fetchMock.mockOnce(JSON.stringify(testRules))
			const rules = await wrapper.rules.fetchAll({})

			rules.map((rule) => {
				const resolved = wrapper.rules.resolveID(rule.id)
				expect(resolved).toEqual(rule)
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

			expect(rule).toEqual(testRule)
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
			expect(resolved).toEqual(rule)
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
			expect(rule).toEqual(originalRule)
		})
		it("Should cache a rule after fetching it", async () => {
			fetchMock.mockOnce(JSON.stringify(testRules[0]))
			const rule = await wrapper.rules.fetchRule({ ruleid: testRules[0].id })

			expect(rule).not.toBeNull()
			const resolved = wrapper.rules.resolveID(rule!.id)
			expect(resolved).not.toBeNull()

			expect(resolved).toEqual(rule)
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

			expect(returned).toEqual(newRule)
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

			expect(returned).not.toBeNull()

			const newCached = wrapper.rules.resolveID(testRule.id)

			// check if the returned rule is correct
			expect(returned).toEqual(newRule)
			
			// check if the old rule is different from the new one
			expect(returned).toEqual(newRule)

			// check if the cached rule is the same as the returned one
			expect(newCached).toEqual(returned)

			// check if the old cached is not equal to the new rule
			expect(returned).not.toEqual(oldCached)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			const testRule = testRules[0]
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.rules.modify({
				ruleId: testRule.id,
				shortdesc: testRule.shortdesc,
				longdesc: testRule.longdesc,
			})).rejects.toThrow()
		})
	})

	describe("remove", () => {
		it("Should be able to remove a rule correctly", async () => {
			const testRule = testRules[0]
			fetchMock.mockOnce(JSON.stringify(testRule))
			const returned = await wrapper.rules.remove({ ruleId: testRule.id })
			expect(returned).toEqual(testRule)
		})
		it("Should remove a rule from cache once it is removed", async () => {
			const testRule = testRules[0]
			wrapper.rules.cache.set(testRule.id, testRule) // set it in the cache

			fetchMock.mockOnce(JSON.stringify(testRule))
			const returned = await wrapper.rules.remove({ ruleId: testRule.id })
			expect(returned).toEqual(testRule)
			const resolved = wrapper.rules.resolveID(testRule.id)
			expect(resolved).toBeNull()
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			const testRule = testRules[0]
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.rules.remove({
				ruleId: testRule.id,
			})).rejects.toThrow()
		})
	})

	describe("merge", () => {
		it("Should be able to merge two rules into one", async () => {
			const [ ruleOne, ruleTwo ] = testRules
			fetchMock.mockOnce(JSON.stringify(ruleOne))
			const returned = await wrapper.rules.merge({
				idReceiving: ruleOne.id,
				idDissolving: ruleTwo.id,
			})
			expect(returned).toEqual(ruleOne)
		})
		it("Should remove the dissolved rule from cache", async () => {
			const [ ruleOne, ruleTwo ] = testRules
			wrapper.rules.cache.set(ruleOne.id, ruleOne) // set it in the cache
			wrapper.rules.cache.set(ruleTwo.id, ruleTwo) // set it in the cache

			fetchMock.mockOnce(JSON.stringify(ruleOne))
			const returned = await wrapper.rules.merge({
				idReceiving: ruleOne.id,
				idDissolving: ruleTwo.id,
			})
			expect(returned).toEqual(ruleOne)

			expect(wrapper.rules.resolveID(ruleOne.id)).toEqual(ruleOne)
			expect(wrapper.rules.resolveID(ruleTwo.id)).toBeNull()
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			const [ ruleOne, ruleTwo ] = testRules
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.rules.merge({
				idReceiving: ruleOne.id,
				idDissolving: ruleTwo.id,
			})).rejects.toThrow()
		})
	})
})