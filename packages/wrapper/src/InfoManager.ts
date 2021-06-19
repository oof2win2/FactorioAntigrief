import fetch from "node-fetch"
import { ManagerOptions, RequestConfig } from "./types/types"
import { Webhook } from "./types/apitypes"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError } from "./types/errors"

export default class InfoManager extends BaseManager<Webhook> {
	public apikey?: string
	private apiurl: string
	constructor(apiurl: string, apikey?: string, opts: ManagerOptions = {}) {
		super(opts)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
	}
	async addWebhook(webhookid: string, webhooktoken: string, guildid: string): Promise<Webhook> {
        const add = await fetch(`${this.apiurl}/informatics/addwebhook`, {
            method: "POST",
            body: JSON.stringify({
                id: webhookid,
                token: webhooktoken,
                guildId: guildid
            }),
            headers: { "content-type": "application/json" },
        }).then(w=>w.json())
        return add
    } 
    async removeWebhook(webhookid: string, webhooktoken: string, guildid: string): Promise<Webhook> {
        const add = await fetch(`${this.apiurl}/informatics/removewebhook`, {
            method: "DELETE",
            body: JSON.stringify({
                id: webhookid,
                token: webhooktoken,
                guildId: guildid
            }),
            headers: { "content-type": "application/json" },
        }).then(w=>w.json())
        return add
    } 
}