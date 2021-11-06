import fetch from "isomorphic-fetch"
import { ManagerOptions, RequestConfig, WrapperOptions } from "../types/types"
import { Rule, ApiID } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import {
	GenericAPIError,
	MasterAuthenticationError,
	NoMasterApikeyError,
} from "../types"

export class RuleManager extends BaseManager<Rule> {
	public apikey?: string
	public masterapikey?: string
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		this.apiurl = options.apiurl
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
	}
	async fetchRule(
		ruleid: ApiID,
		cache = true,
		force = false
	): Promise<Rule | null> {
		if (!force) {
			const cached =
				this.cache.get(ruleid) || this.fetchingCache.get(ruleid)
			if (cached) return cached
		}
		let promiseResolve: (value: unknown) => void
		const fetchingPromise: Promise<Rule | null> = new Promise((resolve) => {
			promiseResolve = resolve
		})

		this.fetchingCache.set(ruleid, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/rules/${strictUriEncode(ruleid)}`,
			{
				credentials: "include",
			}
		).then((r) => r.json())

		if (!fetched || !fetched.id) return null // return null if the fetch is empty

		if (cache) this.add(fetched)
		promiseResolve(fetched)
		setTimeout(() => {
			this.fetchingCache.sweep((data) => typeof data.then === "function")
		}, 0)
		if (fetched.id === ruleid) return fetched
		return null
	}
	async fetchAll(cache = true): Promise<Rule[]> {
		const allRules = await fetch(`${this.apiurl}/rules`, {
			credentials: "include",
		}).then((r) => r.json())

		if (cache && allRules[0])
			return allRules.map((rule: Rule) => this.add(rule))

		return allRules
	}
	resolveID(ruleid: string): Rule | null {
		const cached = this.cache.get(ruleid)
		if (cached) return cached
		return null
	}

	async create(
		rule: Omit<Rule, "id">,
		reqConfig: RequestConfig = {}
	): Promise<Rule> {
		if (!reqConfig.masterapikey && !this.masterapikey)
			throw new NoMasterApikeyError()
		const data = await fetch(`${this.apiurl}/rules`, {
			method: "POST",
			body: JSON.stringify(rule),
			credentials: "include",
			headers: {
				authorization: `Token ${
					reqConfig.masterapikey || this.masterapikey
				}`,
				"content-type": "application/json",
			},
		}).then((r) => r.json())

		if (data.error) {
			if (data.error == "Unauthorized")
				throw new MasterAuthenticationError()
			throw new GenericAPIError(`${data.error}: ${data.message}`)
		}

		this.add(data)

		return data
	}

	async remove(
		id: string,
		reqConfig: RequestConfig = {}
	): Promise<Rule | null> {
		if (!this.masterapikey && !reqConfig.masterapikey)
			throw new NoMasterApikeyError()
		const data = await fetch(
			`${this.apiurl}/rules/${strictUriEncode(id)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: `Token ${
						reqConfig.masterapikey || this.masterapikey
					}`,
					"content-type": "application/json",
				},
			}
		).then((r) => r.json())

		if (data.error) {
			if (data.error == "Unauthorized")
				throw new MasterAuthenticationError()
			throw new GenericAPIError(`${data.error}: ${data.message}`)
		}
		if (!data.id) throw data
		this.removeFromCache(data)

		return data
	}
}
