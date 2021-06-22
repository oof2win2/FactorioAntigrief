import axios from "axios"
import { ManagerOptions } from "../types/types"
import { Webhook } from "../types/apitypes"
import BaseManager from "./BaseManager"

export default class InfoManager extends BaseManager<Webhook> {
	public apikey?: string
	private apiurl: string
	constructor(apiurl: string, apikey?: string, opts: ManagerOptions = {}) {
		super(opts)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
	}
	async addWebhook(webhookid: string, webhooktoken: string, guildid: string): Promise<Webhook> {
		const add = (await axios.post(`${this.apiurl}/informatics/addwebhook`, {
			id: webhookid,
			token: webhooktoken,
			guildId: guildid
		}, {
			headers: { "content-type": "application/json" },
		})).data
		return add
	} 
	async removeWebhook(webhookid: string, webhooktoken: string, guildid: string): Promise<Webhook> {
		const add = (await axios.delete(`${this.apiurl}/informatics/removewebhook`, {
			data: {
				id: webhookid,
				token: webhooktoken,
				guildId: guildid
			},
			headers: { "content-type": "application/json" },
		})).data
		return add
	} 
}