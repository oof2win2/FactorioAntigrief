import "cross-fetch/polyfill"
import { Category } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import {
	GenericAPIError,
	AuthError,
	ManagerOptions,
	WrapperOptions,
} from "../types"
import { FetchRequestTypes } from "../types/privatetypes"
import { masterAuthenticate } from "../utils"
import { z } from "zod"

export class CategoryManager extends BaseManager<Category> {
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		this.apiurl = options.apiurl
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
	}

	async fetchAll({ cache = true }: FetchRequestTypes): Promise<Category[]> {
		const req = await fetch(`${this.apiurl}/categories`, {
			credentials: "include",
		})
		const allCategories = await req.json()

		const parsed = z.array(Category).parse(allCategories)
		if (cache) parsed.map((category) => this.add(category))
		return parsed
	}

	async create({
		category,
		cache = true,
		reqConfig = {},
	}: {
		category: Omit<Category, "id">
	} & FetchRequestTypes): Promise<Category> {
		const req = await fetch(`${this.apiurl}/categories`, {
			method: "POST",
			body: JSON.stringify(category),
			credentials: "include",
			headers: {
				authorization: masterAuthenticate(this, reqConfig),
				"content-type": "application/json",
			},
		})
		if (req.status === 401) throw new AuthError()
		const data = await req.json()

		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)

		const parsed = Category.parse(data)
		if (cache) this.add(parsed)
		return parsed
	}

	async fetchCategory({
		categoryId,
		cache = true,
		force = false,
	}: {
		categoryId: string
	} & FetchRequestTypes): Promise<Category | null> {
		if (!force) {
			const cached =
				this.cache.get(categoryId) || this.fetchingCache.get(categoryId)
			if (cached) return cached
		}
		let promiseResolve!: (
			value: Category | PromiseLike<Category | null> | null
		) => void
		const fetchingPromise: Promise<Category | null> = new Promise(
			(resolve) => {
				promiseResolve = resolve
			}
		)

		if (cache) this.fetchingCache.set(categoryId, fetchingPromise)

		const req = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(categoryId)}`,
			{
				credentials: "include",
			}
		)
		const fetched = await req.json()

		const parsed = Category.nullable().safeParse(fetched)
		if (!parsed.success || parsed.data === null) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(categoryId), 0)
			if (!parsed.success) throw parsed.error
			return null
		}

		if (cache) this.add(parsed.data)
		promiseResolve(fetched)
		setTimeout(() => {
			this.fetchingCache.delete(categoryId)
		}, 0)
		return parsed.data
	}

	async modify({
		categoryId,
		name,
		description,
		reqConfig = {},
	}: {
		categoryId: string
		name?: string
		description?: string
	} & FetchRequestTypes): Promise<Category | null> {
		const req = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(categoryId)}`,
			{
				method: "PATCH",
				credentials: "include",
				body: JSON.stringify({
					name: name,
					description: description,
				}),
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const data = await req.json()

		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)

		const parsed = Category.parse(data)

		// remove old category from cache and add new category
		this.removeFromCache(parsed)
		this.add(parsed)

		return parsed
	}

	async remove({
		categoryId,
		reqConfig = {},
	}: {
		categoryId: string
	} & FetchRequestTypes): Promise<Category | null> {
		const req = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(categoryId)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const data = await req.json()

		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)
		const parsed = Category.parse(data)
		this.removeFromCache(parsed)

		return parsed
	}

	async merge({
		idReceiving,
		idDissolving,
		reqConfig = {},
	}: {
		idReceiving: string
		idDissolving: string
	} & FetchRequestTypes): Promise<Category> {
		const req = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(
				idReceiving
			)}/merge/${strictUriEncode(idDissolving)}`,
			{
				method: "PATCH",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const data = await req.json()

		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)

		const parsed = Category.parse(data)
		this.removeFromCache({ id: idDissolving })
		return parsed
	}
}
