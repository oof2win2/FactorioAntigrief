import "cross-fetch/polyfill"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Category } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { GenericAPIError } from "../types"
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
		const allCategories = await fetch(`${this.apiurl}/categories`, {
			credentials: "include",
		}).then((r) => r.json())

		const parsed = z.array(Category).parse(allCategories)
		if (cache) parsed.map(category => this.add(category))
		return parsed
	}

	async create({
		category,
		cache = true,
		reqConfig = {},
	}: {
		category: Omit<Category, "id">,
	} & FetchRequestTypes): Promise<Category> {
		const data = await fetch(`${this.apiurl}/categories`, {
			method: "POST",
			body: JSON.stringify(category),
			credentials: "include",
			headers: {
				authorization: masterAuthenticate(this, reqConfig),
				"content-type": "application/json",
			},
		}).then((r) => r.json())

		if (data.error) throw new GenericAPIError(`${data.error}: ${data.message}`)

		const parsed = Category.parse(data)
		if (cache) this.add(parsed)
		return parsed
	}

	async fetchCategory({
		categoryid,
		cache = true,
		force = false
	}: {
		categoryid: string
	} & FetchRequestTypes): Promise<Category | null> {
		if (!force) {
			const cached =
				this.cache.get(categoryid) || this.fetchingCache.get(categoryid)
			if (cached) return cached
		}
		let promiseResolve!: (value: Category | PromiseLike<Category | null> | null) => void
		const fetchingPromise: Promise<Category | null> = new Promise((resolve) => {
			promiseResolve = resolve
		})

		if (cache) this.fetchingCache.set(categoryid, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(categoryid)}`,
			{
				credentials: "include",
			}
		).then((r) => r.json())

		const parsed = Category.nullable().safeParse(fetched)
		if (!parsed.success || parsed.data === null) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(categoryid), 0)
			if (!parsed.success) throw parsed.error
			return null
		}

		if (cache) this.add(parsed.data)
		promiseResolve(fetched)
		setTimeout(() => {
			this.fetchingCache.delete(categoryid)
		}, 0)
		return parsed.data
	}

	async modify({
		categoryId,
		shortdesc, longdesc,
		reqConfig = {}
	}: {
		categoryId: string,
		shortdesc?: string, longdesc?: string
	} & FetchRequestTypes): Promise<Category | null> {
		const data = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(categoryId)}`,
			{
				method: "PATCH",
				credentials: "include",
				body: JSON.stringify({
					shortdesc: shortdesc,
					longdesc: longdesc
				}),
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		).then((r) => r.json())

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
		reqConfig = {}
	}: {
		categoryId: string,
	} & FetchRequestTypes): Promise<Category | null> {
		const data = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(categoryId)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		).then((r) => r.json())

		if (data.error) throw new GenericAPIError(`${data.error}: ${data.message}`)
		const parsed = Category.parse(data)
		this.removeFromCache(parsed)

		return parsed
	}

	async merge({
		idReceiving,
		idDissolving,
		reqConfig = {}
	}: {
		idReceiving: string
		idDissolving: string
		} & FetchRequestTypes): Promise<Category> {
		const data = await fetch(
			`${this.apiurl}/categories/${strictUriEncode(idReceiving)}/merge/${strictUriEncode(idDissolving)}`,
			{
				method: "PATCH",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		).then((r) => r.json())

		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)
		
		const parsed = Category.parse(data)
		this.removeFromCache({ id: idDissolving })
		return parsed
	}
}
