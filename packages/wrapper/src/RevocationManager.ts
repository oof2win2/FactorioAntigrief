import fetch from "node-fetch"
import { ManagerOptions, RequestConfig } from "./types/types"
import { ApiID, CreateViolation, Revocation, Violation } from "./types/apitypes"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError } from "./errors"
import strictUriEncode from "strict-uri-encode"
import Collection from "@discordjs/collection"

export default class RevocationManager extends BaseManager<Revocation> {
	public apikey?: string
	private apiurl: string
	private created: Collection<string, number> // Date.now() gives back a number
	constructor(apiurl: string, apikey?: string, options: ManagerOptions = {}) {
		super(options)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
		this.created = new Collection()
	}
	resolveID(revocationid: ApiID): Revocation|null {
		const cached = this.cache.get(revocationid)
		if (cached) return cached
		return null
	}
	async fetchRevocations(playername: string, communityid: string, cache = true): Promise<Revocation[]> {
		const revocations = await fetch(`${this.apiurl}/revocations/getrevocations?playername=${strictUriEncode(playername)}&communityid=${strictUriEncode(communityid)}`)
			.then(r=>r.json())
		if (cache)
			revocations.forEach(revocation => this.add(revocation))
		return revocations
	}
	async fetchAllRevocations(playername: string, cache = true): Promise<Revocation[]> {
		const revocations = await fetch(`${this.apiurl}/revocations/getallrevocations?playername=${strictUriEncode(playername)}`)
			.then(r=>r.json())
		if (cache)
			revocations.forEach(revocation => this.add(revocation))
		return revocations
	}
}