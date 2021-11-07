import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Webhook } from "fagc-api-types"
import BaseManager from "./BaseManager"
import { GenericAPIError, RequestConfig, NoAuthError } from "../types"
import strictUriEncode from "strict-uri-encode"
import { APIEmbed } from "discord-api-types"

export default class InfoManager extends BaseManager<Webhook> {
	public apikey?: string
	public masterapikey?: string
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
	}
	async addWebhook(
		webhookid: string,
		webhooktoken: string
	): Promise<Webhook> {
		const add = await fetch(`${this.apiurl}/informatics/webhook`, {
			method: "POST",
			body: JSON.stringify({
				id: webhookid,
				token: webhooktoken,
			}),
			credentials: "include",
			headers: { "content-type": "application/json" },
		}).then((w) => w.json())
		if (add.error) throw new GenericAPIError(`${add.error}: ${add.message}`)
		return add
	}
	async removeWebhook(
		webhookid: string,
		webhooktoken: string
	): Promise<Webhook | null> {
		const add = await fetch(`${this.apiurl}/informatics/webhook`, {
			method: "DELETE",
			body: JSON.stringify({
				id: webhookid,
				token: webhooktoken,
			}),
			credentials: "include",
			headers: { "content-type": "application/json" },
		}).then((w) => w.json())
		return add
	}

	async notifyGuildText(
		guildId: string,
		text: string,
		reqConfig: RequestConfig = {}
	): Promise<void> {
		if (
			!this.masterapikey &&
			!reqConfig.masterapikey &&
			!reqConfig.cookieAuth
		)
			throw new NoAuthError()

		await fetch(
			`${this.apiurl}/informatics/notify/${strictUriEncode(guildId)}`,
			{
				method: "POST",
				body: JSON.stringify({
					data: text,
				}),
				credentials: "include",
				headers: {
					authorization: `Token ${reqConfig.apikey || this.apikey}`,
					"content-type": "application/json",
				},
			}
		)
	}
	async notifyGuildEmbed(
		guildId: string,
		embed: APIEmbed,
		reqConfig: RequestConfig = {}
	): Promise<void> {
		if (
			!this.masterapikey &&
			!reqConfig.masterapikey &&
			!reqConfig.cookieAuth
		)
			throw new NoAuthError()

		await fetch(
			`${this.apiurl}/informatics/notify/${strictUriEncode(
				guildId
			)}/embed`,
			{
				method: "POST",
				body: JSON.stringify(embed),
				credentials: "include",
				headers: {
					authorization: `Token ${reqConfig.apikey || this.apikey}`,
					"content-type": "application/json",
				},
			}
		)
	}
}
