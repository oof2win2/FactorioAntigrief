import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Report, CreateReport, ApiID } from "fagc-api-types"
import BaseManager from "./BaseManager"
import {
	GenericAPIError,
} from "../types/errors"
import strictUriEncode from "strict-uri-encode"
import { FetchRequestTypes } from "../types/privatetypes"
import { Authenticate } from "../utils"

export default class ReportManager extends BaseManager<Report> {
	constructor(
		options: WrapperOptions,
		managerOptions: ManagerOptions = {}
	) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}

	async fetchAll({
		cache = true,
	}: FetchRequestTypes): Promise<Report[]> {
		const reports = await fetch(`${this.apiurl}/reports`, {
			credentials: "include",
		}).then((c) => c.json())

		if (reports.error)
			throw new GenericAPIError(`${reports.error}: ${reports.message}`)

		reports.forEach((report) => {
			report.reportedTime = new Date(report.reportedTime)
			if (cache) this.add(report)
		})
		return reports
	}

	@Authenticate()
	async create({
		report,
		cache = true,
		reqConfig = {}
	}: {
		report: CreateReport
	} & FetchRequestTypes): Promise<Report> {
		const create = await fetch(`${this.apiurl}/reports`, {
			method: "POST",
			body: JSON.stringify(report),
			credentials: "include",
			headers: {
				authorization: `${reqConfig._keystring}`,
				"content-type": "application/json",
			},
		}).then((u) => u.json())

		if (create.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
		create.reportedTime = new Date(create.reportedTime)
		if (cache) this.add(create)
		return create
	}

	async fetchReport({
		id,
		cache = true,
		force = false
	}: {
		id: ApiID
	} & FetchRequestTypes): Promise<Report | null> {
		if (!force) {
			const cached = this.cache.get(id) || this.fetchingCache.get(id)
			if (cached) return cached
		}

		// this is so that if another fetch is created for this same report whilst the first one is still running, it will not execute another fetch
		// rather it will make it wait for the first one to finish and then return it
		let promiseResolve!: (value: Report | PromiseLike<Report | null> | null) => void
		const fetchingPromise: Promise<Report | null> = new Promise(
			(resolve) => {
				promiseResolve = resolve
			}
		)
		this.fetchingCache.set(id, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/reports/${strictUriEncode(id)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error)
			throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		fetched.reportedTime = new Date(fetched.reportedTime)
		if (cache) this.add(fetched)
		promiseResolve(fetched)
		// remove the data from the fetching cache after 0ms (will run in the next event loop) as it can use the normal cache instead
		setTimeout(() => {
			this.fetchingCache.sweep((data) => typeof data.then === "function")
		}, 0)
		return fetched
	}

	async search({
		playername,
		ruleId,
		communityId,
		cache = true,
	}: {
		playername?: string,
		ruleId?: string,
		communityId?: string,
	} & FetchRequestTypes):	 Promise<Report[]> {
		if (!playername && !ruleId && !communityId)
			throw new Error("At least one of the search parameters must be set")
		
		const params = new URLSearchParams()
		if (playername) params.append("playername", playername)
		if (ruleId) params.append("ruleId", ruleId)
		if (communityId) params.append("communityId", communityId)

		const data = await fetch(`${this.apiurl}/reports/search?${params.toString()}`, {
			credentials: "include",
		}).then((c) => c.json())
		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)
		
		data.forEach((report) => {
			report.reportedTime = new Date(report.reportedTime)
			if (cache) this.add(report)
		})
		return data
	}
	
	async fetchByRule({
		ruleid, cache = true
	}: {
		ruleid: ApiID
	} & FetchRequestTypes): Promise<Report[]> {
		const ruleReports = await fetch(
			`${this.apiurl}/reports/rule/${strictUriEncode(ruleid)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		ruleReports.forEach((report) => {
			report.reportedTime = new Date(report.reportedTime)
			if (cache) this.add(report)
		})
		return ruleReports
	}

	async fetchAllName({
		playername, cache = true
	}: {
		playername: string
	} & FetchRequestTypes): Promise<Report[]> {
		const allReports = await fetch(
			`${this.apiurl}/reports/player/${strictUriEncode(playername)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (allReports.error)
			throw new GenericAPIError(
				`${allReports.error}: ${allReports.message}`
			)

		allReports.forEach((report) => {
			report.reportedTime = new Date(report.reportedTime)
			if (cache) this.add(report)
		})
		return allReports
	}

	async fetchByCommunity({
		communityId, cache = true
	}: {
		communityId: ApiID
	} & FetchRequestTypes): Promise<Report[]> {
		const communityReports = await fetch(
			`${this.apiurl}/reports/community/${strictUriEncode(communityId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())
		if (communityReports.error)
			throw new GenericAPIError(
				`${communityReports.error}: ${communityReports.message}`
			)
		communityReports.forEach((report) => {
			report.reportedTime = new Date(report.reportedTime)
			if (cache) this.add(report)
		})
		return communityReports
	}

	async list({
		playername,
		ruleIDs,
		communityIDs,
		cache = true
	}: {
		playername?: string
		ruleIDs: string[]
		communityIDs: string[]
		cache?: boolean
	}): Promise<Report[]> {
		const reports = await fetch(`${this.apiurl}/reports/list`, {
			method: "POST",
			body: JSON.stringify({
				playername: playername,
				ruleIDs: ruleIDs,
				communityIDs: communityIDs,
			}),
			credentials: "include",
			headers: {
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (reports.error)
			throw new GenericAPIError(`${reports.error}: ${reports.message}`)
		
		if (cache) {
			reports.forEach((report) => {
				report.reportedTime = new Date(report.reportedTime)
				this.add(report)
			})
		}
		return reports
	}

	async fetchSince({
		timestamp, cache = true
	}: {
		timestamp: Date
	} & FetchRequestTypes): Promise<Report[]> {
		const reports = await fetch(
			`${this.apiurl}/reports/since/${timestamp.toISOString()}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (reports.error)
			throw new GenericAPIError(`${reports.error}: ${reports.message}`)

		if (cache) {
			reports.forEach((report) => {
				report.reportedTime = new Date(report.reportedTime)
				report.timestamp = new Date(report.timestamp)
				this.add(report)
			})
		}
		return reports
	}
}
