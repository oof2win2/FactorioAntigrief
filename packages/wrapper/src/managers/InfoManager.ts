import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Webhook } from "fagc-api-types"
import BaseManager from "./BaseManager"
import { GenericAPIError } from "../types"
import strictUriEncode from "strict-uri-encode"
import { APIEmbed } from "discord-api-types"
import { FetchRequestTypes } from "../types/privatetypes"
import { MasterAuthenticate } from "../utils"

export default class InfoManager extends BaseManager<Webhook> {
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
	}
	async addWebhook({
		webhookid, webhooktoken
	}: {
		webhookid: string,
		webhooktoken: string
	}): Promise<Webhook> {
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
	async removeWebhook({
		webhookid, webhooktoken
	}: {
		webhookid: string,
		webhooktoken: string
	}): Promise<Webhook | null> {
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

	@MasterAuthenticate()
	async notifyGuildText({
		guildId,
		text,
		reqConfig = {}
	}: {
		guildId: string,
		text: string,
	} & FetchRequestTypes): Promise<void> {
		await fetch(
			`${this.apiurl}/informatics/notify/${strictUriEncode(guildId)}`,
			{
				method: "POST",
				body: JSON.stringify({
					data: text,
				}),
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
					"content-type": "application/json",
				},
			}
		)
	}
	@MasterAuthenticate()
	async notifyGuildEmbed({
		guildId,
		embed,
		reqConfig = {}
	}: {
		guildId: string,
		embed: APIEmbed,
	} & FetchRequestTypes): Promise<void> {
		await fetch(
			`${this.apiurl}/informatics/notify/${strictUriEncode(
				guildId
			)}/embed`,
			{
				method: "POST",
				body: JSON.stringify(embed),
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
					"content-type": "application/json",
				},
			}
		)
	}
}
