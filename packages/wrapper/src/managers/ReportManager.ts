import "cross-fetch/polyfill"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Report, CreateReport } from "fagc-api-types"
import BaseManager from "./BaseManager"
import {
	GenericAPIError,
} from "../types/errors"
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
		cache = true,
	}: FetchRequestTypes): Promise<Report[]> {
		const reports = await fetch(`${this.apiurl}/reports`, {
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
		const create = await fetch(`${this.apiurl}/reports`, {
			method: "POST",
			body: JSON.stringify(report),
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
				"content-type": "application/json",
			},
		}).then((u) => u.json())

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
		if (!playername && !categoryId && !communityId)
			throw new Error("At least one of the search parameters must be set")
		
		const params = new URLSearchParams()
		if (playername) params.append("playername", playername)
		if (categoryId) params.append("categoryId", categoryId)
		if (communityId) params.append("communityId", communityId)

		const data = await fetch(`${this.apiurl}/reports/search?${params.toString()}`, {
			credentials: "include",
		}).then((c) => c.json())
		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)

		const parsed = z.array(Report).parse(data)

		if (cache) parsed.forEach((report) => this.add(report))
		return parsed
	}
	
	async fetchByCategory({
		categoryId, cache = true
	}: {
		categoryId: string
	} & FetchRequestTypes): Promise<Report[]> {
		const categoryReports = await fetch(
			`${this.apiurl}/reports/category/${strictUriEncode(categoryId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		const parsed = z.array(Report).parse(categoryReports)

		if (cache) parsed.forEach((report) => this.add(report))
		return parsed
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
		
		const parsed = z.array(Report).parse(allReports)
		if (cache) parsed.forEach((report) => this.add(report))
		return parsed
	}

	async fetchByCommunity({
		communityId, cache = true
	}: {
		communityId: string
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
		
		const parsed = z.array(Report).parse(communityReports)
		if (cache) parsed.forEach((report) => this.add(report))
		return parsed
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
		const reports = await fetch(`${this.apiurl}/reports/list`, {
			method: "POST",
			body: JSON.stringify({
				playername: playername,
				categoryIds: categoryIds,
				communityIds: communityIds,
			}),
			credentials: "include",
			headers: {
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (reports.error)
			throw new GenericAPIError(`${reports.error}: ${reports.message}`)
		
		const parsed = z.array(Report).parse(reports)
		if (cache) parsed.forEach((report) => this.add(report))
		return parsed
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
		
		const parsed = z.array(Report).parse(reports)
		if (cache) parsed.forEach((report) => this.add(report))
		return parsed
	}
}
