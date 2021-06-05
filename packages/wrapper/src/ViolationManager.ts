import fetch from "node-fetch"
import { ManagerOptions, RequestConfig } from "./types/types"
import { ApiID, Violation } from "./types/apitypes"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError } from "./errors"
import strictUriEncode from "strict-uri-encode"
import Collection from "@discordjs/collection"

export default class ViolationManager extends BaseManager<ApiID, Violation> {
	public apikey?: string
	private apiurl: string
	private created: Collection<String, number> // Date.now() gives back a number
	constructor(apiurl: string, apikey?: string, options: ManagerOptions = {}) {
		super(options)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
		this.created = new Collection()
	}
	async fetchViolation (violationid: ApiID, cache=true, force=false): Promise<Violation|null> {
		if (!force) {
			const cached = this.cache.get(violationid)
			if (cached) return cached
		}
		const fetched = await fetch(`${this.apiurl}/violations/getbyid?id=${strictUriEncode(violationid)}`).then(c=>c.json())
		
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.description}`)

		if (!fetched || !fetched.id) return null // return null if the fetch is empty
		if (cache)
			this.cache.set(violationid, fetched)
		return fetched
	}
	async fetchAllName(playername: string, cache=true): Promise<Violation[]> {
		const allViolations = await fetch(`${this.apiurl}/violations/getall?playername=${strictUriEncode(playername)}`).then(c=>c.json())

		if (allViolations.error) throw new GenericAPIError(`${allViolations.error}: ${allViolations.description}`)

		if (cache && allViolations[0]) {
			allViolations.forEach(violation => {
				this.add(violation)
			})
		}
		return allViolations
	}
	resolveID (violationid: string): Violation|null {
		const cached = this.cache.get(violationid)
		if (cached) return cached
		return null
	}
	// async getBy
}