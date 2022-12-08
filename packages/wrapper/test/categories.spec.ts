import { enableFetchMocks } from "jest-fetch-mock"
enableFetchMocks()
import { FDGLWrapper } from "../src/index"
import "cross-fetch"
import { createCategory } from "./util"

const wrapper = new FDGLWrapper({
	masterapikey: "x",
	apikey: "x",
})

const testCategories = Array(50).fill(0).map(() => createCategory())

afterAll(() => wrapper.destroy())

beforeEach(() => wrapper.categories.clearCache())
describe("Categories", () => {
	describe("fetchAll", () => {
		it("Should be able to fetch all categories", async () => {
			fetchMock.mockOnce(JSON.stringify(testCategories))
			const categories = await wrapper.categories.fetchAll({})
	
			expect(categories.length).toBe(testCategories.length)
			categories.map((category, i) => {
				const originalCategory = testCategories[i]
				expect(category).toEqual(originalCategory)
			})
		})
		it("Should cache a category after fetching all", async () => {
			fetchMock.mockOnce(JSON.stringify(testCategories))
			const categories = await wrapper.categories.fetchAll({})

			categories.map((category) => {
				const resolved = wrapper.categories.resolveId(category.id)
				expect(resolved).toEqual(category)
			})
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.categories.fetchAll({})).rejects.toThrow()
		})
	})

	describe("create", () => {
		it("Should create a single category correctly", async () => {
			const testCategory = testCategories[0]
			fetchMock.mockOnce(JSON.stringify(testCategory))
			const category = await wrapper.categories.create({
				category: {
					name: testCategory.name,
					description: testCategory.description,
				}
			})

			expect(category).toEqual(testCategory)
		})
		it("Should cache a category after creating it", async () => {
			const testCategory = testCategories[0]
			fetchMock.mockOnce(JSON.stringify(testCategory))
			const category = await wrapper.categories.create({
				category: {
					name: testCategory.name,
					description: testCategory.description,
				}
			})
			
			const resolved = wrapper.categories.resolveId(category.id)
			expect(resolved).toEqual(category)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.categories.create({
				category: {
					name: "test",
					description: "test",
				}
			})).rejects.toThrow()
		})
	})
	
	describe("fetchCategory", () => {
		it("Should fetch a single category correctly", async () => {
			fetchMock.mockOnce(JSON.stringify(testCategories[0]))
			const originalCategory = testCategories[0]
			const category = await wrapper.categories.fetchCategory({ categoryId: originalCategory.id })
			expect(category).not.toBeNull()
			expect(category).toEqual(originalCategory)
		})
		it("Should cache a category after fetching it", async () => {
			fetchMock.mockOnce(JSON.stringify(testCategories[0]))
			const category = await wrapper.categories.fetchCategory({ categoryId: testCategories[0].id })

			expect(category).not.toBeNull()
			const resolved = wrapper.categories.resolveId(category!.id)
			expect(resolved).not.toBeNull()

			expect(resolved).toEqual(category)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.categories.fetchCategory({ categoryId: testCategories[0].id })).rejects.toThrow()
		})
	})

	describe("modify", () => {
		it("Should return a valid category that is modified", async () => {
			const testCategory = testCategories[0]

			const newCategory = {
				id: testCategory.id,
				name: testCategory.name + "test",
				description: testCategory.description + "test",
			}
			fetchMock.mockOnce(JSON.stringify(newCategory))
			const returned = await wrapper.categories.modify({
				categoryId: testCategory.id,
				name: newCategory.name,
				description: newCategory.description,
			})

			expect(returned).toEqual(newCategory)
		})
		it("Should cache returned category and not have only new version of category in cache", async () => {
			const testCategory = testCategories[0]
			wrapper.categories.cache.set(testCategory.id, testCategory) // set it in the cache
			
			const oldCached = wrapper.categories.resolveId(testCategory.id)

			const newCategory = {
				id: testCategory.id,
				name: testCategory.name + "test",
				description: testCategory.description + "test",
			}
			fetchMock.mockOnce(JSON.stringify(newCategory))
			const returned = await wrapper.categories.modify({
				categoryId: testCategory.id,
				name: newCategory.name,
				description: newCategory.description,
			})

			expect(returned).not.toBeNull()

			const newCached = wrapper.categories.resolveId(testCategory.id)

			// check if the returned category is correct
			expect(returned).toEqual(newCategory)
			
			// check if the old category is different from the new one
			expect(returned).toEqual(newCategory)

			// check if the cached category is the same as the returned one
			expect(newCached).toEqual(returned)

			// check if the old cached is not equal to the new category
			expect(returned).not.toEqual(oldCached)
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			const testCategory = testCategories[0]
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.categories.modify({
				categoryId: testCategory.id,
				name: testCategory.name,
				description: testCategory.description,
			})).rejects.toThrow()
		})
	})

	describe("remove", () => {
		it("Should be able to remove a category correctly", async () => {
			const testCategory = testCategories[0]
			fetchMock.mockOnce(JSON.stringify(testCategory))
			const returned = await wrapper.categories.remove({ categoryId: testCategory.id })
			expect(returned).toEqual(testCategory)
		})
		it("Should remove a category from cache once it is removed", async () => {
			const testCategory = testCategories[0]
			wrapper.categories.cache.set(testCategory.id, testCategory) // set it in the cache

			fetchMock.mockOnce(JSON.stringify(testCategory))
			const returned = await wrapper.categories.remove({ categoryId: testCategory.id })
			expect(returned).toEqual(testCategory)
			const resolved = wrapper.categories.resolveId(testCategory.id)
			expect(resolved).toBeNull()
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			const testCategory = testCategories[0]
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.categories.remove({
				categoryId: testCategory.id,
			})).rejects.toThrow()
		})
	})

	describe("merge", () => {
		it("Should be able to merge two categories into one", async () => {
			const [ categoryOne, categoryTwo ] = testCategories
			fetchMock.mockOnce(JSON.stringify(categoryOne))
			const returned = await wrapper.categories.merge({
				idReceiving: categoryOne.id,
				idDissolving: categoryTwo.id,
			})
			expect(returned).toEqual(categoryOne)
		})
		it("Should remove the dissolved category from cache", async () => {
			const [ categoryOne, categoryTwo ] = testCategories
			wrapper.categories.cache.set(categoryOne.id, categoryOne) // set it in the cache
			wrapper.categories.cache.set(categoryTwo.id, categoryTwo) // set it in the cache

			fetchMock.mockOnce(JSON.stringify(categoryOne))
			const returned = await wrapper.categories.merge({
				idReceiving: categoryOne.id,
				idDissolving: categoryTwo.id,
			})
			expect(returned).toEqual(categoryOne)

			expect(wrapper.categories.resolveId(categoryOne.id)).toEqual(categoryOne)
			expect(wrapper.categories.resolveId(categoryTwo.id)).toBeNull()
		})
		it("Should throw an error if an incorrect response is given from the API", async () => {
			const [ categoryOne, categoryTwo ] = testCategories
			fetchMock.mockOnce(JSON.stringify({ hi: "true" }))
			await expect(wrapper.categories.merge({
				idReceiving: categoryOne.id,
				idDissolving: categoryTwo.id,
			})).rejects.toThrow()
		})
	})
})