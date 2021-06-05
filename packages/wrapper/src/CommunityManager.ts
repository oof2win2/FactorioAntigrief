import fetch from "node-fetch"
import { CommunityConfig, SetCommunityConfig, RequestConfig } from "./types/types"
import { Community, ApiID } from "./types/apitypes"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError } from "./errors"
import strictUriEncode from "strict-uri-encode"

export default class CommunityManager extends BaseManager<ApiID, Community> {
	public apikey?: string
	private apiurl: string
	constructor(apiurl: string, apikey?: string) {
		super()
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
	}
	async fetchCommunity (communityid: ApiID, cache=true, force=false): Promise<Community|null> {
		if (!force) {
			const cached = this.cache.get(communityid)
			if (cached) return cached
		}
		const fetched = await fetch(`${this.apiurl}/communities/getid?id=${strictUriEncode(communityid)}`).then(c=>c.json())
		
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.description}`)

		if (!fetched || !fetched.id) return null // return null if the fetch is empty
		if (cache) this.cache.set(communityid, fetched)
		return fetched
	}
	async fetchAll(cache=true): Promise<Community[]> {
		const allCommunities = await fetch(`${this.apiurl}/communities/getall`).then(c=>c.json())

		if (allCommunities.error) throw new GenericAPIError(`${allCommunities.error}: ${allCommunities.description}`)

		if (cache && allCommunities[0]) {
			return allCommunities.map(community => {
				return this.add(community)
			})
		}
		return allCommunities
	}
	resolveID (communityid: string): Community|null {
		const cached = this.cache.get(communityid)
		if (cached) return cached
		return null
	}
	async fetchConfig(guildid: string): Promise<CommunityConfig|null> {
		const config = await fetch(`${this.apiurl}/communities/getconfig?guildid=${strictUriEncode(guildid)}`).then(c=>c.json())
		
		if (config.error) throw new GenericAPIError(`${config.error}: ${config.description}`)
		if (!config || !config.guildid) return null
		return config
	}
	async setConfig(config: SetCommunityConfig, reqConfig: RequestConfig = {}): Promise<CommunityConfig> {
		if (!this.apikey && !reqConfig.apikey) throw new NoApikeyError()
		const update = await fetch(`${this.apiurl}/communities/setconfig`, {
			method: "POST",
			body: JSON.stringify(config),
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		}).then(u=>u.json())
		if (update.error) {
			if (update.description === 'API key is wrong') throw new AuthenticationError()
			throw new GenericAPIError(`${update.error}: ${update.description}`)
		}
		return update
	}
}