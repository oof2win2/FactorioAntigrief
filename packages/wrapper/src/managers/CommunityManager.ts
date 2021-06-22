import axios from "axios"
import { ManagerOptions, RequestConfig } from "../types/types"
import { CommunityConfig, SetCommunityConfig, Community, ApiID } from "../types/apitypes"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError } from "../types/errors"
import strictUriEncode from "strict-uri-encode"

export default class CommunityManager extends BaseManager<Community> {
	public apikey?: string
	private apiurl: string
	constructor(apiurl: string, apikey?: string, opts: ManagerOptions = {}) {
		super(opts)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
	}
	async fetchCommunity (communityId: ApiID, cache=true, force=false): Promise<Community|null> {
		if (!force) {
			const cached = this.cache.get(communityId)
			if (cached) return cached
		}
		const fetched = (await axios.get(`${this.apiurl}/communities/getid?id=${strictUriEncode(communityId)}`)).data

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.description}`)
		if (cache) this.add(fetched)
		return fetched
	}
	async fetchAll(cache=true): Promise<Community[]> {
		const allCommunities = (await axios.get(`${this.apiurl}/communities/getall`)).data

		if (allCommunities.error) throw new GenericAPIError(`${allCommunities.error}: ${allCommunities.description}`)

		if (cache && allCommunities[0]) {
			return allCommunities.map(community => {
				return this.add(community)
			})
		}
		return allCommunities
	}
	resolveID (communityId: string): Community|null {
		const cached = this.cache.get(communityId)
		if (cached) return cached
		return null
	}
	async fetchConfig(guildId: string): Promise<CommunityConfig|null> {
		const config = (await axios.get(`${this.apiurl}/communities/getconfig?guildId=${strictUriEncode(guildId)}`)).data
		
		if (config.error) throw new GenericAPIError(`${config.error}: ${config.description}`)
		if (!config || !config.guildId) return null
		return config
	}
	async setConfig(config: SetCommunityConfig, reqConfig: RequestConfig = {}): Promise<CommunityConfig> {
		if (!this.apikey && !reqConfig.apikey) throw new NoApikeyError()
		const update = (await axios.post(`${this.apiurl}/communities/setconfig`, config, {
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		})).data
		if (update.error) {
			if (update.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${update.error}: ${update.description}`)
		}
		return update
	}
}