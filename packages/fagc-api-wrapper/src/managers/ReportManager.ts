import "cross-fetch/polyfill"
import { ManagerOptions, WrapperOptions, GenericAPIError, AuthError } from "../types"
import { Report, CreateReport } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { FetchRequestTypes } from "../types/privatetypes"
import { authenticate } from "../utils"
import { z } from "zod"

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
		playername,
		communityId,
		categoryId,
		adminId,
		after,
		cache = true,
	}: {
		playername?: string | string[],
		communityId?: string | string[],
		categoryId?: string | string[],
		adminId?: string | string[],
		after?: Date,
	} & FetchRequestTypes): Promise<Report[]> {
		const url = new URL("./reports", this.apiurl)
		function addParams(name: string, values?: string | string[]) {
			if (values === undefined) values = []
			if (!(values instanceof Array)) values = [ values ]
			values.forEach((v) => url.searchParams.append(name, v))
		}

		addParams("playername", playername)
		addParams("communityId", communityId)
		addParams("categoryId", categoryId)
		addParams("adminId", adminId)
		if (after) url.searchParams.set("after", after.toISOString())
		const reports = await fetch(url.toString(), {
			credentials: "include",
		}).then((c) => c.json())

		if (reports.error)
			throw new GenericAPIError(`${reports.error}: ${reports.message}`)
		
		const parsedReports = z.array(Report).parse(reports)

		if (cache) parsedReports.forEach((report) => this.add(report))
		return reports
	}

	async create({
		report,
		cache = true,
		reqConfig = {}
	}: {
		report: CreateReport
	} & FetchRequestTypes): Promise<Report> {
		const req = await fetch(`${this.apiurl}/reports`, {
			method: "POST",
			body: JSON.stringify(report),
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
				"content-type": "application/json",
			},
		})
		if (req.status === 401) throw new AuthError()
		const create = await req.json()

		if (create.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
		const parsedCreate = Report.parse(create)
		if (cache) this.add(parsedCreate)
		return parsedCreate
	}

	async fetchReport({
		reportId,
		cache = true,
		force = false
	}: {
		reportId: string
	} & FetchRequestTypes): Promise<Report | null> {
		if (!force) {
			const cached = this.cache.get(reportId) || this.fetchingCache.get(reportId)
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
		this.fetchingCache.set(reportId, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/reports/${strictUriEncode(reportId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (!fetched) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(reportId), 0)
			return null // return null if the fetch is empty
		}
		if (fetched.error) {
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(reportId), 0)
			throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		}
		const parsed = Report.safeParse(fetched)
		if (!parsed.success || parsed.data === null) { // if the fetch is not successful, return null or throw an error with invalid data
			promiseResolve(null)
			setTimeout(() => this.fetchingCache.delete(reportId), 0)
			if (!parsed.success) throw parsed.error
			return null
		}
		if (cache) this.add(parsed.data)
		promiseResolve(parsed.data)
		// remove the data from the fetching cache after 0ms (will run in the next event loop) as it can use the normal cache instead
		setTimeout(() => this.fetchingCache.delete(reportId), 0)
		return parsed.data
	}

	// Obsolete accessors
	async search({
		playername,
		categoryId,
		communityId,
		cache = true,
	}: {
		playername?: string,
		categoryId?: string,
		communityId?: string,
	} & FetchRequestTypes):	 Promise<Report[]> {
		return await this.fetchAll({ playername, categoryId, communityId, cache })
	}

	async fetchByCategory({
		categoryId, cache = true
	}: {
		categoryId: string
	} & FetchRequestTypes): Promise<Report[]> {
		return await this.fetchAll({ categoryId, cache })
	}

	async fetchAllName({
		playername, cache = true
	}: {
		playername: string
	} & FetchRequestTypes): Promise<Report[]> {
		return await this.fetchAll({ playername, cache })
	}

	async fetchByCommunity({
		communityId, cache = true
	}: {
		communityId: string
	} & FetchRequestTypes): Promise<Report[]> {
		return await this.fetchAll({ communityId, cache })
	}

	async list({
		playername,
		categoryIds,
		communityIds,
		cache = true
	}: {
		playername?: string
		categoryIds: string[]
		communityIds: string[]
		cache?: boolean
	}): Promise<Report[]> {
		return await this.fetchAll({ playername, categoryId: categoryIds, communityId: communityIds, cache })
	}

	async fetchSince({
		timestamp, cache = true
	}: {
		timestamp: Date
	} & FetchRequestTypes): Promise<Report[]> {
		return await this.fetchAll({ after: timestamp, cache })
	}
}
