import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Revocation, ApiID } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { GenericAPIError } from ".."
import { FetchRequestTypes } from "../types/privatetypes"

export default class RevocationManager extends BaseManager<Revocation> {	
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}

	resolveID(revocationid: ApiID): Revocation | null {
		const cached = this.cache.get(revocationid)
		if (cached) return cached
		return null
	}

	addRevocation(revocation: Revocation): void {
		this.add(revocation)
	}

	async fetchRevocations({
		playername,
		communityId,
		cache = true
	}: {
		playername: string,
		communityId: string,
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations/community/${strictUriEncode(
				playername
			)}/${strictUriEncode(communityId)}`,
			{
				credentials: "include",
			}
		).then((r) => r.json())
		if (!revocations || !revocations[0]) return []
		if (cache)
			revocations.forEach((revocation: Revocation) =>
				this.add(revocation)
			)
		return revocations
	}

	async fetchAllRevocations({
		playername,
		cache = true
	}: {
		playername: string
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations/player/${strictUriEncode(playername)}`,
			{ credentials: "include" }
		).then((r) => r.json())
		if (!revocations || !revocations[0]) return []
		if (cache)
			revocations.forEach((revocation: Revocation) =>
				this.add(revocation)
			)
		return revocations
	}

	async fetchModifiedSince({
		timestamp,
		cache = true
	}: {
		timestamp: Date,
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${
				this.apiurl
			}/revocations/modifiedSince/${timestamp.toISOString()}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (revocations.error)
			throw new GenericAPIError(
				`${revocations.error}: ${revocations.message}`
			)

		if (cache) {
			revocations.forEach((revocation) => {
				revocation.reportedTime = new Date(revocation.reportedTime)
				revocation.timestamp = new Date(revocation.timestamp)
				this.add(revocation)
			})
		}
		return revocations
	}
}
