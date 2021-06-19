import fetch from "node-fetch"
import { ManagerOptions, RequestConfig } from "../types/types"
import { ApiID, CreateReport, Revocation, Report } from "../types/apitypes"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError, UnsuccessfulRevocationError } from "../types/errors"
import strictUriEncode from "strict-uri-encode"
import Collection from "@discordjs/collection"

export default class ReportManager extends BaseManager<Report> {
	public apikey?: string
	private apiurl: string
	private createRevocation: (revocationObject: Revocation) => void
	constructor(apiurl: string, createRevocation: (revocationObject: Revocation) => void, apikey?: string, options: ManagerOptions = {}) {
		super(options)
		if (apikey) this.apikey = apikey
		this.apiurl = apiurl
		this.createRevocation = createRevocation
	}
	async fetchReport (reportid: ApiID, cache=true, force=false): Promise<Report|null> {
		if (!force) {
			const cached = this.cache.get(reportid)
			if (cached) return cached
		}
		const fetched = await fetch(`${this.apiurl}/reports/getbyid?id=${strictUriEncode(reportid)}`).then(c=>c.json())

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.description}`)
		if (cache) this.add(fetched)
		return fetched
	}
	async fetchAllName(playername: string, cache=true): Promise<Report[]> {
		const allReports = await fetch(`${this.apiurl}/reports/getall?playername=${strictUriEncode(playername)}`).then(c=>c.json())

		if (allReports.error) throw new GenericAPIError(`${allReports.error}: ${allReports.description}`)

		if (cache && allReports[0]) {
			allReports.forEach(report => this.add(report))
		}
		return allReports
	}
	resolveID (reportid: ApiID): Report|null {
		const cached = this.cache.get(reportid)
		if (cached) return cached
		return null
	}
	async fetchByRule(ruleid: ApiID, cache = true): Promise<Report[]> {
		const ruleReports = await fetch(`${this.apiurl}/reports/getbyrule?id=${strictUriEncode(ruleid)}`).then(c=>c.json())
		if (cache) ruleReports.forEach(report => this.add(report))
		return ruleReports
	}
	async create(report: CreateReport, cache = true, reqConfig: RequestConfig = {}): Promise<Report> {
		if (!this.apikey && !reqConfig.apikey) throw new NoApikeyError()

		const create = await fetch(`${this.apiurl}/reports/create`, {
			method: "POST",
			body: JSON.stringify(report),
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		}).then(u=>u.json())

		if (create.error) {
			if (create.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${create.error}: ${create.description}`)
		}
		if (cache) this.add(create)
		return create
	}
	async revoke(reportid: ApiID, adminId: string, cache = true, reqConfig: RequestConfig = {}): Promise<Revocation> {
		const revoked = await fetch(`${this.apiurl}/reports/revoke`, {
			method: "DELETE",
			body: JSON.stringify({
				id: reportid,
				adminId: adminId,
			}),
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		}).then(u=>u.json())

		if (revoked.error) {
			if (revoked.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${revoked.error}: ${revoked.description}`)
		}

		if (!revoked?.revokedTime) throw new UnsuccessfulRevocationError()
		if (cache) this.createRevocation(revoked)
		this.cache.sweep((report) => report.id === reportid) // remove the revoked report from cache as it isnt working anymore
		return revoked
	}
	async revokeAllName(playername: string, adminId: string, cache = true, reqConfig: RequestConfig = {}): Promise<Report[]|null> {
		const revoked = await fetch(`${this.apiurl}/reports/revokeallname`, {
			method: "DELETE",
			body: JSON.stringify({
				playername: playername,
				adminId: adminId,
			}),
			headers: { "apikey": this.apikey || reqConfig.apikey, "content-type": "application/json" },
		}).then(u=>u.json())

		if (revoked.error) {
			if (revoked.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${revoked.error}: ${revoked.description}`)
		}

		revoked.forEach(revocation => {
			if (!revocation?.reportedTime) throw new UnsuccessfulRevocationError()
			if (cache) this.createRevocation(revocation)
		})
		this.cache.sweep((report) => report.playername === playername) // remove the revoked report from cache as it isnt working anymore
		return revoked
	}
}