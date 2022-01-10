import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions, GenericAPIError } from "../types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { Community, GuildConfig, ApiID } from "fagc-api-types"
import { FetchRequestTypes } from "../types/privatetypes"
import { Authenticate, MasterAuthenticate } from "../utils"

type SetGuildConfig = Partial<GuildConfig> & Pick<GuildConfig, "guildId">
type SetCommunityConfig = Partial<Omit<Community, "id">>

export default class CommunityManager extends BaseManager<Community> {
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
	}

	async fetchCommunity({
		communityID,
		cache = true,
		force = false
	}: {
		communityID: ApiID,
	} & FetchRequestTypes): Promise<Community | null> {
		if (!force) {
			const cached =
				this.cache.get(communityID) ||
				this.fetchingCache.get(communityID)
			if (cached) return cached
		}

		let promiseResolve!: (value: Community | PromiseLike<Community | null> | null) => void
		const fetchingPromise: Promise<Community | null> = new Promise(
			(resolve) => {
				promiseResolve = resolve
			}
		)

		this.fetchingCache.set(communityID, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(communityID)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error)
			throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		if (cache) this.add(fetched)
		promiseResolve(fetched)
		setTimeout(() => {
			this.fetchingCache.sweep((data) => typeof data.then === "function")
		}, 0)
		return fetched
	}

	async fetchAll({ cache = true }: FetchRequestTypes): Promise<Community[]> {
		const allCommunities = await fetch(`${this.apiurl}/communities`, {
			credentials: "include",
		}).then((c) => c.json())

		if (allCommunities.error)
			throw new GenericAPIError(
				`${allCommunities.error}: ${allCommunities.message}`
			)

		if (cache && allCommunities[0]) {
			return allCommunities.map((community) => {
				return this.add(community)
			})
		}
		return allCommunities
	}
	
	@Authenticate()
	async fetchOwnCommunity({
		cache = true,
		reqConfig = {}
	}: FetchRequestTypes): Promise<Community | null> {
		const community = await fetch(`${this.apiurl}/communities/getown`, {
			credentials: "include",
			headers: {
				authorization: `${reqConfig._keystring}`,
			},
		}).then((c) => c.json())

		if (!community) return null

		if (community.error)
			throw new GenericAPIError(
				`${community.error}: ${community.message}`
			)

		if (cache) this.add(community)
		return community
	}

	resolveID(communityId: string): Community | null {
		const cached = this.cache.get(communityId)
		if (cached) return cached
		return null
	}

	async fetchGuildConfig({
		guildId
	}: {guildId: string} & FetchRequestTypes): Promise<GuildConfig | null> {
		const config = await fetch(
			`${this.apiurl}/communities/guildconfig/${strictUriEncode(
				guildId
			)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())
		if (config?.error)
			throw new GenericAPIError(`${config.error}: ${config.message}`)
		if (!config || !config.guildId) return null
		return config
	}
	
	@Authenticate()
	async fetchOwnGuildConfig({
		reqConfig = {}
	}: FetchRequestTypes): Promise<GuildConfig | null> {
		const config = await fetch(`${this.apiurl}/communities/guildconfig`, {
			credentials: "include",
			headers: {
				authorization: `${reqConfig._keystring}`,
			},
		}).then((u) => u.json())

		if (config?.error)
			throw new GenericAPIError(`${config.error}: ${config.message}`)

		return config
	}

	@Authenticate()
	async setGuildConfig({
		config,
		reqConfig = {}
	}: {
		config: SetGuildConfig,
	} & FetchRequestTypes): Promise<GuildConfig> {
		const update = await fetch(`${this.apiurl}/communities/guildconfig/${config.guildId}`, {
			method: "POST",
			body: JSON.stringify(config),
			credentials: "include",
			headers: {
				authorization: `${reqConfig._keystring}`,
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (update?.error)
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		return update
	}

	async fetchCommunityConfig({
		communityID,
		cache,
		force,
	}: {
		communityID: ApiID
	} & FetchRequestTypes): Promise<Community | null> {
		return this.fetchCommunity({ communityID, cache, force })
	}

	@Authenticate()
	async setCommunityConfig({
		config,
		reqConfig = {}
	}: {
		config: SetCommunityConfig,
	} & FetchRequestTypes): Promise<Community> {
		const update = await fetch(
			`${this.apiurl}/communities/communityconfig`,
			{
				method: "POST",
				body: JSON.stringify(config),
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
					"content-type": "application/json",
				},
			}
		).then((u) => u.json())
		if (update?.error)
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		return update
	}

	@MasterAuthenticate()
	async notifyGuildConfig({
		guildID,
		reqConfig = {}
	}: {
		guildID: string,
	} & FetchRequestTypes): Promise<void> {
		const create = await fetch(
			`${this.apiurl
			}/communities/notifyGuildConfigChanged/${strictUriEncode(guildID)}`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((u) => u.json())
		if (create?.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

	@MasterAuthenticate()
	async guildLeave({
		guildID,
		reqConfig = {}
	}: {
		guildID: string,
	} & FetchRequestTypes): Promise<void> {
		const create = await fetch(
			`${this.apiurl}/communities/guildLeave/${strictUriEncode(guildID)}`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((u) => u.json())
		if (create?.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

	@MasterAuthenticate()
	async create({
		name,
		contact,
		guildID,
		reqConfig = {}
	}: {
		name: string,
		contact: string,
		guildID?: string,
	} & FetchRequestTypes): Promise<{
		community: Community
		apiKey: string
	}> {
		const create = await fetch(`${this.apiurl}/communities`, {
			method: "POST",
			body: JSON.stringify({
				name: name,
				contact: contact,
				...(guildID && { // add it in optionally otherwise it is not in request
					guildId: guildID
				})
			}),
			credentials: "include",
			headers: {
				authorization: `${reqConfig._keystring}`,
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (create?.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
		return create
	}

	@MasterAuthenticate()
	async remove({
		communityID,
		reqConfig = {}
	}: {
		communityID: string
	} & FetchRequestTypes): Promise<boolean> {
		const remove = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(communityID)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((u) => u.json())
		if (remove?.error)
			throw new GenericAPIError(`${remove.error}: ${remove.message}`)
		return remove
	}

	@MasterAuthenticate()
	async merge({
		idReceiving,
		idDissolving,
		reqConfig = {}
	}: {
		idReceiving: string
		idDissolving: string
		} & FetchRequestTypes): Promise<Community> {
		const remove = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(idReceiving)}/merge/${strictUriEncode(idDissolving)}`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((u) => u.json())
		if (remove?.error)
			throw new GenericAPIError(`${remove.error}: ${remove.message}`)
		return remove
	}
}
