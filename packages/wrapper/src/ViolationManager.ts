import fetch from "node-fetch"
import { ManagerOptions, RequestConfig } from "./types/types"
import { ApiID, CreateViolation, Revocation, Violation } from "./types/apitypes"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError, UnsuccessfulRevocationError } from "./types/errors"
import strictUriEncode from "strict-uri-encode"
import Collection from "@discordjs/collection"

export default class ViolationManager extends BaseManager<Violation> {
	public apikey?: string
	private apiurl: string
	private created: Collection<string, number> // Date.now() gives back a number
	private createRevocation: (revocationObject: Revocation) => void
	constructor(apiurl: string, createRevocation: (revocationObject: Revocation) => void, apikey?: string, options: ManagerOptions = {}) {
		super(options)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
		this.created = new Collection()
		this.createRevocation = createRevocation
	}
	async fetchViolation (violationid: ApiID, cache=true, force=false): Promise<Violation|null> {
		if (!force) {
			const cached = this.cache.get(violationid)
			if (cached) return cached
		}
		const fetched = await fetch(`${this.apiurl}/violations/getbyid?id=${strictUriEncode(violationid)}`).then(c=>c.json())

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.description}`)
		if (cache) this.add(fetched)
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
	resolveID (violationid: ApiID): Violation|null {
		const cached = this.cache.get(violationid)
		if (cached) return cached
		return null
	}
	async fetchByRule(ruleid: ApiID, cache = true): Promise<Violation[]> {
		const ruleViolations = await fetch(`${this.apiurl}/violations/getbyrule?id=${strictUriEncode(ruleid)}`).then(c=>c.json())
		if (cache) ruleViolations.forEach(violation => this.add(violation))
		return ruleViolations
	}
	async create(violation: CreateViolation, cache = true, reqConfig: RequestConfig = {}): Promise<Violation> {
		if (!this.apikey && !reqConfig.apikey) throw new NoApikeyError()

		const create = await fetch(`${this.apiurl}/violations/create`, {
			method: "POST",
			body: JSON.stringify(violation),
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		}).then(u=>u.json())

		if (create.error) {
			if (create.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${create.error}: ${create.description}`)
		}
		if (cache) this.add(create)
		return create
	}
	async revoke(violationid: ApiID, adminId: string, cache = true, reqConfig: RequestConfig = {}): Promise<Revocation> {
		const revoked = await fetch(`${this.apiurl}/violations/revoke`, {
			method: "DELETE",
			body: JSON.stringify({
				id: violationid,
				adminId: adminId,
			}),
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		}).then(u=>u.json())

		if (revoked.error) {
			if (revoked.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${revoked.error}: ${revoked.description}`)
		}

		if (!revoked?.revokedTime) throw new UnsuccessfulRevocationError()
		if (cache) this.createRevocation(revoked)
		this.cache.sweep((violation) => violation.id === violationid) // remove the revoked violation from cache as it isnt working anymore
		return revoked
	}
	async revokeAllName(playername: string, adminId: string, cache = true, reqConfig: RequestConfig = {}): Promise<Violation[]|null> {
		const revoked = await fetch(`${this.apiurl}/violations/revokeallname`, {
			method: "DELETE",
			body: JSON.stringify({
				playername: playername,
				adminId: adminId,
			}),
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		}).then(u=>u.json())

		if (revoked.error) {
			if (revoked.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${revoked.error}: ${revoked.description}`)
		}

		revoked.forEach(revocation => {
			if (!revocation?.violatedTime) throw new UnsuccessfulRevocationError()
			if (cache) this.createRevocation(revocation)
		})
		this.cache.sweep((violation) => violation.playername === playername) // remove the revoked violation from cache as it isnt working anymore
		return revoked
	}
}