import "cross-fetch/polyfill"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Webhook } from "fagc-api-types"
import BaseManager from "./BaseManager"
import { GenericAPIError } from "../types"
import strictUriEncode from "strict-uri-encode"
import { APIEmbed } from "discord-api-types"
import { FetchRequestTypes } from "../types/privatetypes"
import { masterAuthenticate } from "../utils"

export default class InfoManager extends BaseManager<Webhook> {
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
	}
	async addWebhook({
		webhookId, webhookToken
	}: {
		webhookId: string,
		webhookToken: string
	}): Promise<Webhook> {
		const webhookPath = `${strictUriEncode(webhookId)}/${strictUriEncode(webhookToken)}`
		const add = await fetch(`${this.apiurl}/discord/webhook/${webhookPath}`, {
			method: "PUT",
			credentials: "include",
		}).then((w) => w.json())
		if (add.error) throw new GenericAPIError(`${add.error}: ${add.message}`)
		return Webhook.parse(add)
	}
	async removeWebhook({
		webhookId, webhookToken
	}: {
		webhookId: string,
		webhookToken: string
	}): Promise<Webhook | null> {
		const webhookPath = `${strictUriEncode(webhookId)}/${strictUriEncode(webhookToken)}`
		const add = await fetch(`${this.apiurl}/discord/webhook/${webhookPath}`, {
			method: "DELETE",
			credentials: "include",
		}).then((w) => w.json())
		return Webhook.nullable().parse(add)
	}

	async messageGuild({
		guildId,
		content,
		embeds,
		reqConfig = {},
	}: {
		guildId: string,
		content?: string,
		embeds?: APIEmbed[],
	} & FetchRequestTypes): Promise<void> {
		await fetch(
			`${this.apiurl}/discord/guilds/${strictUriEncode(guildId)}/message`,
			{
				method: "POST",
				body: JSON.stringify({
					content: content,
					embeds: embeds,
				}),
				credentials: "include",
				headers: {
					authorization: masterAuthenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		)
	}

	async notifyGuildText({
		guildId,
		text,
		reqConfig = {}
	}: {
		guildId: string,
		text: string,
	} & FetchRequestTypes): Promise<void> {
		return await this.messageGuild({ guildId, content: text, reqConfig })
	}

	async notifyGuildEmbed({
		guildId,
		embed,
		reqConfig = {}
	}: {
		guildId: string,
		embed: APIEmbed,
	} & FetchRequestTypes): Promise<void> {
		return await this.messageGuild({ guildId, embeds: [ embed ], reqConfig })
	}
}
