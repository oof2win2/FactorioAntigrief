import "cross-fetch/polyfill"
import { strict as assert } from "assert"
import { ManagerOptions, WrapperOptions, GenericAPIError, AuthError } from "../types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { Community, GuildConfig } from "fagc-api-types"
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
		cache = true,
		reqConfig = {}
	}: {
		config: SetCommunityConfig,
	} & FetchRequestTypes): Promise<Community> {
		const req = await fetch(
			`${this.apiurl}/communities/own`,
			{
				method: "PATCH",
				body: JSON.stringify(config),
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const update = await req.json()

		if (update?.error)
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		const parsedUpdate = Community.parse(update)
		if (cache) this.add(parsedUpdate)
		return parsedUpdate
	}

	async getCommunityConfig({
		communityId,
		cache = true,
		reqConfig = {}
	}: {
		communityId: string,
	} & FetchRequestTypes): Promise<Community | null> {
		return this.fetchCommunity({ communityId, cache, reqConfig })
	}
	
	async fetchCommunity({
		communityId,
		cache = true,
		force = false
	}: {
		communityId: string,
	} & FetchRequestTypes): Promise<Community | null> {
		if (!force) {
			const cached =
				this.cache.get(communityId) ||
				this.fetchingCache.get(communityId)
			if (cached) return cached
		}

		let promiseResolve!: (value: Community | PromiseLike<Community | null> | null) => void
		const fetchingPromise: Promise<Community | null> = new Promise(
			(resolve) => {
				promiseResolve = resolve
			}
		)

		this.fetchingCache.set(communityId, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(communityId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (!fetched) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(communityId), 0)
			return null // return null if the fetch is empty
		}
		if (fetched.error) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(communityId), 0)
			throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		}
		
		const communityParsed = Community.safeParse(fetched)
		if (!communityParsed.success || communityParsed.data === null) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(communityId), 0)
			if (!communityParsed.success) throw communityParsed.error
			return null
		}
		
		if (cache) this.add(communityParsed.data)
		promiseResolve(communityParsed.data)
		setTimeout(() => this.fetchingCache.delete(communityId), 0)
		return communityParsed.data
	}
	
	async fetchOwnCommunity({
		cache = true,
		reqConfig = {}
	}: FetchRequestTypes): Promise<Community | null> {
		const req = await fetch(`${this.apiurl}/communities/own`, {
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
			},
		})

		if (req.status === 401) throw new AuthError()
		const community = await req.json()

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
		const req = await fetch(`${this.apiurl}/discord/guilds/${config.guildId}`, {
			method: "PATCH",
			body: JSON.stringify(config),
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
				"content-type": "application/json",
			},
		})
		if (req.status === 401) throw new AuthError()
		const update = await req.json()

		if (update.error) throw new GenericAPIError(`${update.error}: ${update.message}`)
		const parsedUpdate = GuildConfig.parse(update)
		return parsedUpdate
	}

	async setGuildConfigMaster({
		config,
		reqConfig = {}
	}: {
		config: SetGuildConfig,
	} & FetchRequestTypes): Promise<GuildConfig> {
		const req = await fetch(`${this.apiurl}/discord/guilds/${config.guildId}`, {
			method: "PATCH",
			body: JSON.stringify(config),
			credentials: "include",
			headers: {
				authorization: masterAuthenticate(this, reqConfig),
				"content-type": "application/json",
			},
		})
		if (req.status === 401) throw new AuthError()
		const update = await req.json()

		if (update.error) throw new GenericAPIError(`${update.error}: ${update.message}`)
		const parsedUpdate = GuildConfig.parse(update)
		return parsedUpdate
	}

	async fetchGuildConfig({
		guildId,
	}: {guildId: string} & FetchRequestTypes): Promise<GuildConfig | null> {
		const config = await fetch(
			`${this.apiurl}/discord/guilds/${strictUriEncode(guildId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())
		if (config?.error) throw new GenericAPIError(`${config.error}: ${config.message}`)
		const parsedConfig = GuildConfig.parse(config)
		return parsedConfig
	}

	async fetchGuildConfigMaster({
		guildId,
		reqConfig = {}
	}: {guildId: string} & FetchRequestTypes): Promise<GuildConfig | null> {
		const req = await fetch(
			`${this.apiurl}/discord/guilds/${strictUriEncode(guildId)}`,
			{
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				}
			}
		)
		if (req.status === 401) throw new AuthError()
		const config = await req.json()

		if (config?.error) throw new GenericAPIError(`${config.error}: ${config.message}`)
		const parsedConfig = GuildConfig.parse(config)
		return parsedConfig
	}

	/**
	 * Manage API key for your community
	 */
	async manageApikey({
		create,
		invalidate,
		reqConfig = {},
	}: {
		create?: boolean,
		invalidate?: boolean,
	} & FetchRequestTypes): Promise<{ apikey?: string }> {
		const req = await fetch(`${this.apiurl}/communites/own/apikey`, {
			method: "POST",
			body: JSON.stringify({
				create,
				invalidate,
			}),
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
				"content-type": "application/json",
			},
		})
		if (req.status === 401) throw new AuthError()
		const key = await req.json()

		if (key.error) throw new GenericAPIError(`${key.error}: ${key.message}`)
		const parsed = z.object({
			apikey: z.string().optional(),
		}).parse(key)
		return parsed
	}
	/**
	 * Create a new API key for your community
	 */
	async createApikey({
		reqConfig = {}
	}: FetchRequestTypes): Promise<string> {
		const result = await this.manageApikey({ create: true, reqConfig })
		assert(result.apikey)
		return result.apikey
	}

	/**
	 * Revoke all currently valid API keys created
	 * @returns New API key to use
	 */
	async revokeApikeys({
		reqConfig = {}
	}:  FetchRequestTypes): Promise<string> {
		const result = await this.manageApikey({ create: true, invalidate: true, reqConfig })
		assert(result.apikey)
		return result.apikey
	}

	/**
	 * Manage an API key for a community with the use of the master API
	 */
	async masterManageApikey({
		communityId,
		create,
		keyType = "private",
		invalidate,
		reqConfig = {}
	}: {
		communityId: string,
		create?: boolean,
		keyType?: "master" | "private"
		invalidate?: boolean,
	} & FetchRequestTypes): Promise<{ apikey?: string }> {
		const req = await fetch(`${this.apiurl}/communities/${strictUriEncode(communityId)}/apikey`, {
			method: "POST",
			body: JSON.stringify({
				create,
				...(create ? { type: keyType } : {}),
				invalidate,
			}),
			credentials: "include",
			headers: {
				authorization: masterAuthenticate(this, reqConfig),
				"content-type": "application/json",
			},
		})
		if (req.status === 401) throw new AuthError()
		const key = await req.json()

		if (key.error) throw new GenericAPIError(`${key.error}: ${key.message}`)
		const parsed = z.object({
			apikey: z.string().optional(),
		}).parse(key)
		return parsed
	}


	/**
	 * Create an API key for a community with the use of the master API
	 */
	async masterCreateKey({
		communityId,
		keyType = "private",
		reqConfig = {}
	}: {
		communityId: string,
		keyType: "master" | "private"
	} & FetchRequestTypes): Promise<string> {
		const result = await this.masterManageApikey({ communityId, create: true, keyType, reqConfig })
		assert(result.apikey)
		return result.apikey
	}

	/**
	 * Revoke all currently valid API keys created for community
	 * @returns New API key to use
	 */
	async masterRevokeKeys({
		communityId,
		reqConfig = {}
	}: {
		communityId: string
	} & FetchRequestTypes): Promise<string> {
		const result = await this.masterManageApikey({ communityId, create: true, invalidate: true, reqConfig })
		assert(result.apikey)
		return result.apikey
	}

	async create({
		name,
		contact,
		cache = true,
		reqConfig = {}
	}: {
		name: string,
		contact: string,
	} & FetchRequestTypes): Promise<{
		community: Community
		apikey: string
	}> {
		const req = await fetch(`${this.apiurl}/communities`, {
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
		})
		if (req.status === 401) throw new AuthError()
		const create = await req.json()

		if (create?.error) throw new GenericAPIError(`${create.error}: ${create.message}`)
		
		const parsedCreate = z.object({
			community: Community,
			apikey: z.string(),
		}).parse(create)
		if (cache) this.add(parsedCreate.community)
		return parsedCreate
	}

	async createGuildConfig({
		guildId,
		reqConfig = {}
	}: {
		guildId: string
	} & FetchRequestTypes): Promise<GuildConfig> {
		const req = await fetch(`${this.apiurl}/discord/guilds`, {
			method: "POST",
			body: JSON.stringify({
				guildId: guildId,
			}),
			credentials: "include",
			headers: {
				authorization: masterAuthenticate(this, reqConfig),
				"content-type": "application/json",
			},
		})
		if (req.status === 401) throw new AuthError()
		const create = await req.json()

		if (create.error) throw new GenericAPIError(`${create.error}: ${create.message}`)
		const parsedCreate = GuildConfig.parse(create)
		return parsedCreate
	}

	async notifyGuildConfigChanged({
		guildId,
		reqConfig = {}
	}: {
		guildId: string,
	} & FetchRequestTypes): Promise<void> {
		const req = await fetch(
			`${this.apiurl}/discord/guilds/${strictUriEncode(guildId)}/notifyChanged`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const create = await req.json()

		if (create?.error) throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

	async guildLeave({
		guildId,
		reqConfig = {}
	}: {
		guildId: string,
	} & FetchRequestTypes): Promise<void> {
		const req = await fetch(
			`${this.apiurl}/discord/guilds/${strictUriEncode(guildId)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const create = await req.json()

		if (create?.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

	async remove({
		communityId,
		reqConfig = {}
	}: {
		communityId: string
	} & FetchRequestTypes): Promise<boolean> {
		const req = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(communityId)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const remove = await req.json()

		if (remove?.error) throw new GenericAPIError(`${remove.error}: ${remove.message}`)
		this.removeFromCache({
			id: communityId,
		})
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
		const req = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(idReceiving)}/merge/${strictUriEncode(idDissolving)}`,
			{
				method: "PATCH",
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const merge = await req.json()

		if (merge?.error) throw new GenericAPIError(`${merge.error}: ${merge.message}`)
		this.removeFromCache({ id: idDissolving })
		return Community.parse(merge)
	}
}
