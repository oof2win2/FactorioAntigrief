import fetch from "node-fetch"
import { RequestConfig } from "./types/types"
import { CommunityConfig, SetCommunityConfig, Rule, ApiID } from "./types/apitypes"
import BaseManager from "./BaseManager"
import { GenericAPIError } from "./errors"
import strictUriEncode from "strict-uri-encode"

export class RuleManager extends BaseManager<ApiID, Rule> {
	public apikey?: string
	private apiurl: string
	constructor(apiurl: string, apikey?: string) {
		super()
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
	}
	async fetchRule(ruleid: ApiID, cache=true, force=false): Promise<Rule|null> {
		if (!force) {
			const cached = this.cache.get(ruleid)
			if (cached) return cached
		}
		
		const fetched = await fetch(`${this.apiurl}/rules/getid?id=${strictUriEncode(ruleid)}`).then(r=>r.json())

		if (!fetched || !fetched.id) return null // return null if the fetch is empty
		
		if (cache) this.cache.set(ruleid, fetched)
		if (fetched?.id === ruleid) return fetched
		return null
	}
	async fetchAll(cache=true, force=false): Promise<Rule[]> {
		const allRules = await fetch(`${this.apiurl}/rules/getall`).then(r=>r.json())
		
		if (cache && allRules[0])
			return allRules.map(rule => this.add(rule))
		
		return allRules
	}
	resolveID(ruleid: string): Rule {
		const cached = this.cache.get(ruleid)
		if (cached) return cached
		return null
	}
}