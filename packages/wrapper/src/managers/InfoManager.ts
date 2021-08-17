import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Webhook } from "fagc-api-types"
import BaseManager from "./BaseManager"
import { GenericAPIError } from "../types"

export default class InfoManager extends BaseManager<Webhook> {
	public apikey?: string
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}
	async addWebhook(webhookid: string, webhooktoken: string): Promise<Webhook> {
		const add = await fetch(`${this.apiurl}/informatics/webhook`, {
			method: "POST",
			body: JSON.stringify({
				id: webhookid,
				token: webhooktoken,
			}),
			headers: { "content-type": "application/json" },
		}).then(w=>w.json())
		if (add.error) throw new GenericAPIError(`${add.error}: ${add.message}`)
		return add
	} 
	async removeWebhook(webhookid: string, webhooktoken: string): Promise<Webhook | null> {
		const add = await fetch(`${this.apiurl}/informatics/webhook`, {
			method: "DELETE",
			body: JSON.stringify({
				id: webhookid,
				token: webhooktoken,
			}),
			headers: { "content-type": "application/json" },
		}).then(w=>w.json())
		return add
	} 
}