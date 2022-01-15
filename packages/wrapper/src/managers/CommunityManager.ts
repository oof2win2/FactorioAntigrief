import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions, GenericAPIError } from "../types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { Community, GuildConfig, Report } from "fagc-api-types"
import { FetchRequestTypes } from "../types/privatetypes"
import { authenticate, masterAuthenticate } from "../utils"
import { z } from "zod"

type SetGuildConfig = Partial<GuildConfig> & Pick<GuildConfig, "guildId">
type SetCommunityConfig = Partial<Omit<Community, "id"|"guildIds">>

export default class CommunityManager extends BaseManager<Community> {
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
	}

	async fetchAll({ cache = true }: FetchRequestTypes): Promise<Community[]> {
		const allCommunities = await fetch(`${this.apiurl}/communities`, {
			credentials: "include",
		}).then((c) => c.json())

		if (allCommunities.error)
			throw new GenericAPIError(
				`${allCommunities.error}: ${allCommunities.message}`
			)
		const parsedCommunities = z.array(Community).parse(allCommunities)

		if (cache)
			parsedCommunities.map((community) => {
				return this.add(community)
			})
		return parsedCommunities
	}

	async setCommunityConfig({
		config,
		reqConfig = {}
	}: {
		config: SetCommunityConfig,
	} & FetchRequestTypes): Promise<Community> {
		const update = await fetch(
			`${this.apiurl}/communities`,
			{
				method: "PATCH",
				body: JSON.stringify(config),
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		).then((u) => u.json())
		if (update?.error)
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		const parsedUpdate = Community.parse(update)
		return parsedUpdate
	}

	async getCommunityConfig({
		communityID,
		cache = true,
		reqConfig = {}
	}: {
		communityID: string,
	} & FetchRequestTypes): Promise<Community | null> {
		return this.fetchCommunity({ communityID, cache, reqConfig })
	}
	
	async fetchCommunity({
		communityID,
		cache = true,
		force = false
	}: {
		communityID: string,
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
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		
		const communityParsed = Community.safeParse(fetched)
		if (!communityParsed.success || communityParsed.data === null) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(communityID), 0)
			if (!communityParsed.success) throw communityParsed.error
			return null
		}
		
		if (cache) this.add(communityParsed.data)
		promiseResolve(communityParsed.data)
		setTimeout(() => this.fetchingCache.delete(communityID), 0)
		return communityParsed.data
	}
	
	async fetchOwnCommunity({
		cache = true,
		reqConfig = {}
	}: FetchRequestTypes): Promise<Community | null> {
		const community = await fetch(`${this.apiurl}/communities/own`, {
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
			},
		}).then((c) => c.json())

		if (!community) return null

		if (community.error)
			throw new GenericAPIError(
				`${community.error}: ${community.message}`
			)

		const parsedCommunity = Community.parse(community)

		if (cache) this.add(parsedCommunity)
		return parsedCommunity
	}

	async setGuildConfig({
		config,
		reqConfig = {}
	}: {
		config: SetGuildConfig,
	} & FetchRequestTypes): Promise<GuildConfig> {
		const update = await fetch(`${this.apiurl}/communities/guilds/${config.guildId}`, {
			method: "PATCH",
			body: JSON.stringify(config),
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (update.error) throw new GenericAPIError(`${update.error}: ${update.message}`)
		const parsedUpdate = GuildConfig.parse(update)
		return parsedUpdate
	}

	async fetchGuildConfig({
		guildId
	}: {guildId: string} & FetchRequestTypes): Promise<GuildConfig | null> {
		const config = await fetch(
			`${this.apiurl}/communities/guilds/${strictUriEncode(guildId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())
		if (config?.error) throw new GenericAPIError(`${config.error}: ${config.message}`)
		const parsedConfig = GuildConfig.parse(config)
		return parsedConfig
	}

	async create({
		name,
		contact,
		reqConfig = {}
	}: {
		name: string,
		contact: string,
	} & FetchRequestTypes): Promise<{
		community: Community
		apiKey: string
	}> {
		const create = await fetch(`${this.apiurl}/communities`, {
			method: "POST",
			body: JSON.stringify({
				name: name,
				contact: contact,
			}),
			credentials: "include",
			headers: {
				authorization: masterAuthenticate(this, reqConfig),
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (create?.error) throw new GenericAPIError(`${create.error}: ${create.message}`)
		
		const parsedCreate = z.object({
			community: Community,
			apiKey: z.string(),
		}).parse(create)
		return parsedCreate
	}

	async createGuildConfig({
		guildId,
		reqConfig = {}
	}: {
		guildId: string
	} & FetchRequestTypes): Promise<GuildConfig> {
		const create = await fetch(`${this.apiurl}/communities/guilds`, {
			method: "POST",
			body: JSON.stringify({
				guildId: guildId,
			}),
			credentials: "include",
			headers: {
				authorization: masterAuthenticate(this, reqConfig),
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (create.error) throw new GenericAPIError(`${create.error}: ${create.message}`)
		const parsedCreate = GuildConfig.parse(create)
		return parsedCreate
	}

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
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		).then((u) => u.json())
		if (create?.error) throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

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
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		).then((u) => u.json())
		if (create?.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

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
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		).then((u) => u.json())
		if (remove?.error) throw new GenericAPIError(`${remove.error}: ${remove.message}`)
		return z.boolean().parse(remove)
	}

	async merge({
		idReceiving,
		idDissolving,
		reqConfig = {}
	}: {
		idReceiving: string
		idDissolving: string
		} & FetchRequestTypes): Promise<Community> {
		const merge = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(idReceiving)}/merge/${strictUriEncode(idDissolving)}`,
			{
				method: "PATCH",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		).then((u) => u.json())
		if (merge?.error) throw new GenericAPIError(`${merge.error}: ${merge.message}`)
		return Community.parse(merge)
	}
}
