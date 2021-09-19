import fetch from "isomorphic-fetch"
import { ManagerOptions, RequestConfig, WrapperOptions } from "../types/types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { GenericAPIError } from ".."

export default class UserManager extends BaseManager<null> {
	public apikey?: string
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}
	async fetchUser(discordUserId: string): Promise<unknown> {
		const fetched = await fetch(
			`${this.apiurl}/users/${strictUriEncode(discordUserId)}`
		).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)

		return fetched
	}
	async fetchOAuthURL(): Promise<URL> {
		const fetched = await fetch(`${this.apiurl}/users/oauth2/url`).then(
			(c) => c.json()
		)
		if (fetched.url) return new URL(fetched.url)
		throw new GenericAPIError(fetched)
	}

	async addUserToCommunity(
		discordUserId: string,
		config: {
			reports?: boolean
			config?: boolean
			notifications?: boolean
		} = {},
		reqConfig: RequestConfig = {}
	): Promise<unknown> {
		const fetched = await fetch(
			`${this.apiurl}/users/addUserToCommunity/${strictUriEncode(
				discordUserId
			)}`,
			{
				method: "POST",
				body: JSON.stringify(config),
				headers: {
					authorization: `Token ${reqConfig.apikey || this.apikey}`,
					"content-type": "application/json",
				},
			}
		).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)
		return fetched
	}

	async removeUserFromCommunity(
		discordUserId: string,
		reqConfig: RequestConfig = {}
	): Promise<unknown> {
		const fetched = await fetch(
			`${this.apiurl}/users/removeUserFromCommunity/${strictUriEncode(
				discordUserId
			)}`,
			{
				method: "DELETE",
				headers: {
					authorization: `Token ${reqConfig.apikey || this.apikey}`,
				},
			}
		).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)
		return fetched
	}
}
