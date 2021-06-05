import fetch from "node-fetch"
import Collection from "@discordjs/collection"
import { Community, ApiID } from "./types"
import BaseManager from "./BaseManager"

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
		const fetched = await fetch(`${this.apiurl}/communities/getid?id=${communityid}`).then(c=>c.json())
		if (!fetched || !fetched.id) return null // return null if the fetch is empty
		if (cache) this.cache.set(communityid, fetched)
		return fetched
	}
	async fetchAll(cache=true): Promise<Community[]> {
		const allCommunities = await fetch(`${this.apiurl}/communities/getall`).then(c=>c.json())
		if (cache && allCommunities[0]) {
			return allCommunities.map(community => {
				return this.add(community)
			})
		}
		return allCommunities
	}
	async resolveID (communityid: string): Promise<Community|null> {
		const cached = this.cache.get(communityid)
		if (cached) return cached
		return this.fetchCommunity(communityid)
	}
	async fetchConfig(guildid): Promise<Community|null> {
		const config = await fetch(`${this.apiurl}/communities/getconfig?guildid=${guildid}`).then(c=>c.json())
		if (!config || !config.guildid) return null
		return config
	}
}