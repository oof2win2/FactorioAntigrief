import fetch from "isomorphic-fetch"
import { ManagerOptions, RequestConfig } from "../types/types"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError } from "../types/errors"
import strictUriEncode from "strict-uri-encode"
import { Community, CommunityConfig, ApiID } from "fagc-api-types"

type SetCommunityConfig = Partial<CommunityConfig>

export default class CommunityManager extends BaseManager<Community> {
	public apikey?: string
	private apiurl: string
	constructor(apiurl: string, apikey?: string, opts: ManagerOptions = {}) {
		super(opts)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
	}
	async fetchCommunity(communityId: ApiID, cache = true, force = false): Promise<Community | null> {
		if (!force) {
			const cached = this.cache.get(communityId)
			if (cached) return cached
		}
		const fetched = await fetch(`${this.apiurl}/communities/${strictUriEncode(communityId)}`).then(c => c.json())

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		if (cache) this.add(fetched)
		return fetched
	}
	async fetchAll(cache = true): Promise<Community[]> {
		const allCommunities = await fetch(`${this.apiurl}/communities`).then(c => c.json())

		if (allCommunities.error) throw new GenericAPIError(`${allCommunities.error}: ${allCommunities.message}`)

		if (cache && allCommunities[0]) {
			return allCommunities.map(community => {
				return this.add(community)
			})
		}
		return allCommunities
	}
	resolveID(communityId: string): Community | null {
		const cached = this.cache.get(communityId)
		if (cached) return cached
		return null
	}
	async fetchConfig(guildId: string): Promise<CommunityConfig | null> {
		const config = await fetch(`${this.apiurl}/communities/config/${strictUriEncode(guildId)}`).then(c => c.json())

		if (config.error) throw new GenericAPIError(`${config.error}: ${config.message}`)
		if (!config || !config.guildId) return null
		return config
	}
	async setConfig(config: SetCommunityConfig, reqConfig: RequestConfig = {}): Promise<CommunityConfig> {
		if (!this.apikey && !reqConfig.apikey) throw new NoApikeyError()
		const update = await fetch(`${this.apiurl}/communities/config`, {
			method: "POST",
			body: JSON.stringify(config),
			headers: { "authorization": `Token ${this.apikey || reqConfig.apikey}`, "content-type": "application/json" },
		}).then(u => u.json())
		if (update.error) {
			if (update.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		}
		return update
	}
}