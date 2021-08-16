import fetch from "isomorphic-fetch"
import { ManagerOptions, RequestConfig, WrapperOptions } from "../types/types"
import { Revocation, Report, CreateReport, ApiID } from "fagc-api-types"
import BaseManager from "./BaseManager"
import { AuthenticationError, GenericAPIError, NoApikeyError, UnsuccessfulRevocationError } from "../types/errors"
import strictUriEncode from "strict-uri-encode"

export default class ReportManager extends BaseManager<Report> {
	public apikey?: string
	private apiurl: string
	private createRevocation: (revocationObject: Revocation) => void
	constructor(options: WrapperOptions, createRevocation: (revocationObject: Revocation) => void, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
		this.createRevocation = createRevocation
	}
	
	async fetchReport (reportid: ApiID, cache=true, force=false): Promise<Report|null> {
		if (!force) {
			const cached = this.cache.get(reportid)
			if (cached) return cached
		}
		const fetched = await fetch(`${this.apiurl}/reports/${strictUriEncode(reportid)}`).then(c=>c.json())

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error) throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		fetched.reportedTime = new Date(fetched.reportedTime)
		if (cache) this.add(fetched)
		return fetched
	}
	async fetchAllName(playername: string, cache=true): Promise<Report[]> {
		const allReports = await fetch(`${this.apiurl}/reports/getplayer/${strictUriEncode(playername)}`).then(c=>c.json())

		if (allReports.error) throw new GenericAPIError(`${allReports.error}: ${allReports.message}`)

		if (cache && allReports[0]) {
			allReports.forEach(report => {
				report.reportedTime = new Date(report.reportedTime)
				this.add(report)
			})
		}
		return allReports
	}
	resolveID (reportid: ApiID): Report|null {
		const cached = this.cache.get(reportid)
		if (cached) return cached
		return null
	}
	async fetchByRule(ruleid: ApiID, cache = true): Promise<Report[]> {
		const ruleReports = await fetch(`${this.apiurl}/reports/rule/${strictUriEncode(ruleid)}`).then(c=>c.json())
		if (cache) {
			ruleReports.forEach(report => {
				report.reportedTime = new Date(report.reportedTime)
				this.add(report)
			})
		}
		return ruleReports
	}
	async create(report: CreateReport, cache = true, reqConfig: RequestConfig = {}): Promise<Report> {
		if (!this.apikey && !reqConfig.apikey) throw new NoApikeyError()

		const create = await fetch(`${this.apiurl}/reports`, {
			method: "POST",
			body: JSON.stringify(report),
			headers: { "authorization": `Token ${this.apikey || reqConfig.apikey}`, "content-type": "application/json" },
		}).then(u=>u.json())

		if (create.error) {
			if (create.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${create.error}: ${create.message}`)
		}
		create.reportedTime = new Date(create.reportedTime)
		if (cache) this.add(create)
		return create
	}
	async revoke(reportid: ApiID, adminId: string, cache = true, reqConfig: RequestConfig = {}): Promise<Revocation> {
		const revoked = await fetch(`${this.apiurl}/reports`, {
			method: "DELETE",
			body: JSON.stringify({
				id: reportid,
				adminId: adminId,
			}),
			headers: { "authorization": `Token ${this.apikey || reqConfig.apikey}`, "content-type": "application/json" },
		}).then(u=>u.json())

		if (revoked.error) {
			if (revoked.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${revoked.error}: ${revoked.message}`)
		}

		if (!revoked?.revokedTime) throw new UnsuccessfulRevocationError()
		revoked.reportedTime = new Date(revoked.reportedTime)
		revoked.revokedTime = new Date(revoked.revokedTime)
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
			headers: { "authorization": `Token ${this.apikey || reqConfig.apikey}`, "content-type": "application/json" },
		}).then(u=>u.json())

		if (revoked.error) {
			if (revoked.description === "API key is wrong") throw new AuthenticationError()
			throw new GenericAPIError(`${revoked.error}: ${revoked.message}`)
		}

		revoked.forEach(revocation => {
			if (!revocation?.reportedTime) throw new UnsuccessfulRevocationError()
			revocation.reportedTime = new Date(revocation.reportedTime)
			revocation.revokedTime = new Date(revocation.revokedTime)
			if (cache) this.createRevocation(revocation)
		})
		this.cache.sweep((report) => report.playername === playername) // remove the revoked report from cache as it isnt working anymore
		return revoked
	}
}