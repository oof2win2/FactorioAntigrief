import fetch from "node-fetch"
import { ManagerOptions } from "../types/types"
import { ApiID, Offense, Revocation, Report } from "../types/apitypes"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import Collection from "@discordjs/collection"

export default class OffenseManager extends BaseManager<Report> {
	public apikey?: string
	private apiurl: string
	constructor(apiurl: string, apikey?: string, options: ManagerOptions = {}) {
		super(options)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
	}
	async fetchCommunity(playername: string, communityId: ApiID): Promise<Offense> {
		const fetched = await fetch(`${this.apiurl}/offenses/getcommunity?playername=${strictUriEncode(playername)}&communityId=${strictUriEncode(communityId)}`)
			.then(o=>o.json())
		return fetched
	}
	async fetchAll(playername: string): Promise<Offense[]> {
		const fetched = await fetch(`${this.apiurl}/offenses/getall?playername=${strictUriEncode(playername)}`)
			.then(o=>o.json())
		return fetched
	}
}