import fetch from "isomorphic-fetch"
import { ManagerOptions, RequestConfig, WrapperOptions } from "../types/types"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError } from "../types/errors"
import strictUriEncode from "strict-uri-encode"
import { Community, CommunityConfig, ApiID } from "fagc-api-types"

type SetCommunityConfig = Partial<CommunityConfig>

export default class CommunityManager extends BaseManager<Community> {
	public apikey?: string
	public masterapikey?: string
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
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
	async fetchOwnCommunity(cache = true, reqConfig: RequestConfig = {}): Promise<Community | null> {
		if (!reqConfig.apikey && !this.apikey) throw new NoApikeyError()

		const community = await fetch(`${this.apiurl}/communities/getown`, {
			headers: { "authorization": `Token ${reqConfig.apikey || this.apikey}`},
		}).then(c => c.json())

		if (!community) return null

		if (community.error) {
			if (community.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${community.error}: ${community.message}`)
		}

		if (cache) this.add(community)
		return community
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
		if (!reqConfig.apikey && !this.apikey) throw new NoApikeyError()

		const update = await fetch(`${this.apiurl}/communities/config`, {
			method: "POST",
			body: JSON.stringify(config),
			headers: { "authorization": `Token ${reqConfig.apikey || this.apikey}`, "content-type": "application/json" },
		}).then(u => u.json())
		if (update.error) {
			if (update.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		}
		return update
	}

	async create(name: string, contact: string, guildId: string, reqConfig: RequestConfig = {}): Promise<{
		community: Community,
		apiKey: string
	}> {
		if (!reqConfig.masterapikey && !this.masterapikey) throw new NoApikeyError()

		const create = await fetch(`${this.apiurl}/communities`, {
			method: "POST",
			body: JSON.stringify({
				name: name,
				contact: contact,
				guildId: guildId
			}),
			headers: { "authorization": `Token ${reqConfig.masterapikey || this.masterapikey}`, "content-type": "application/json" },
		}).then(u => u.json())
		if (create.error) {
			if (create.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${create.error}: ${create.message}`)
		}
		return create
	}

	async remove(communityId: string, reqConfig: RequestConfig = {}): Promise<boolean> {
		if (!this.masterapikey && !reqConfig.masterapikey) throw new NoApikeyError()

		const remove = await fetch(`${this.apiurl}/communities/${strictUriEncode(communityId)}`, {
			method: "DELETE",
			headers: { "authorization": `Token ${reqConfig.masterapikey || this.masterapikey}` },
		}).then(u => u.json())
		if (remove.error) {
			if (remove.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${remove.error}: ${remove.message}`)
		}
		return remove
	}
}