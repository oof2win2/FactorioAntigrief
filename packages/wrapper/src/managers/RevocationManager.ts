import "cross-fetch/polyfill"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Revocation } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { AuthError, GenericAPIError } from ".."
import { FetchRequestTypes } from "../types/privatetypes"
import { authenticate } from "../utils"
import { z } from "zod"

export default class RevocationManager extends BaseManager<Revocation> {
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}

	async fetchAll({
		playername,
		categoryId,
		adminId,
		after,
		cache = true,
		reqConfig = {},
	}: {
		playername?: string | string[]
		categoryId?: string | string[]
		adminId?: string | string[]
		after?: Date
	} & FetchRequestTypes): Promise<Revocation[]> {
		const url = new URL("./revocations", this.apiurl)
		function addParams(name: string, values?: string | string[]) {
			if (values === undefined) values = []
			if (!(values instanceof Array)) values = [values]
			values.forEach((v) => url.searchParams.append(name, v))
		}

		addParams("playername", playername)
		addParams("categoryId", categoryId)
		addParams("adminId", adminId)
		if (after) url.searchParams.set("after", after.toISOString())
		const req = await fetch(url.toString(), {
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
			},
		})
		if (req.status === 401) throw new AuthError()
		const revocations = await req.json()

		if (revocations.error)
			throw new GenericAPIError(
				`${revocations.error}: ${revocations.message}`
			)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach((revocation) => this.add(revocation))
		return parsed
	}

	async fetchRevocation({
		revocationId,
		cache = true,
		reqConfig = {},
	}: {
		revocationId: string
	} & FetchRequestTypes): Promise<Revocation | null> {
		const req = await fetch(`${this.apiurl}/revocations/${revocationId}`, {
			credentials: "include",
			headers: {
				authorization: authenticate(this, reqConfig),
			},
		})
		if (req.status === 401) throw new AuthError()
		const revocation = await req.json()

		if (!revocation) return null
		const parsed = Revocation.parse(revocation)
		if (cache) this.add(parsed)
		return parsed
	}

	async revoke({
		reportId,
		adminId,
		cache = true,
		reqConfig = {},
	}: {
		reportId: string
		adminId: string
	} & FetchRequestTypes): Promise<Revocation> {
		const req = await fetch(`${this.apiurl}/revocations`, {
			method: "POST",
			body: JSON.stringify({
				reportId: reportId,
				adminId: adminId,
			}),
			credentials: "include",
			headers: {
				"content-type": "application/json",
				authorization: authenticate(this, reqConfig),
			},
		})
		if (req.status === 401) throw new AuthError()
		const revocation = await req.json()

		if (revocation.error)
			throw new GenericAPIError(
				`${revocation.error}: ${revocation.message}`
			)

		const parsed = Revocation.parse(revocation)
		if (cache) this.add(parsed)
		return parsed
	}

	async revokeCategory({
		categoryId,
		adminId,
		cache = true,
		reqConfig = {},
	}: {
		categoryId: string
		adminId: string
	} & FetchRequestTypes): Promise<Revocation[]> {
		const req = await fetch(
			`${this.apiurl}/revocations/category/${strictUriEncode(
				categoryId
			)}`,
			{
				method: "POST",
				body: JSON.stringify({
					adminId: adminId,
				}),
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const revocations = await req.json()

		if (revocations.error)
			throw new GenericAPIError(
				`${revocations.error}: ${revocations.message}`
			)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach((revocation) => this.add(revocation))
		return parsed
	}

	async revokePlayer({
		playername,
		adminId,
		cache = true,
		reqConfig = {},
	}: {
		playername: string
		adminId: string
	} & FetchRequestTypes): Promise<Revocation[]> {
		const req = await fetch(
			`${this.apiurl}/revocations/player/${strictUriEncode(playername)}`,
			{
				method: "POST",
				body: JSON.stringify({
					adminId: adminId,
				}),
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
					"content-type": "application/json",
				},
			}
		)
		if (req.status === 401) throw new AuthError()
		const revocations = await req.json()

		if (revocations.error)
			throw new GenericAPIError(
				`${revocations.error}: ${revocations.message}`
			)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach((revocation) => this.add(revocation))
		return parsed
	}

	// Obsolete accessors
	async fetchCategory({
		categoryId,
		cache = true,
		reqConfig = {},
	}: {
		categoryId: string
	} & FetchRequestTypes): Promise<Revocation[]> {
		return await this.fetchAll({ categoryId, cache, reqConfig })
	}

	async fetchPlayer({
		playername,
		cache = true,
		reqConfig = {},
	}: {
		playername: string
	} & FetchRequestTypes): Promise<Revocation[]> {
		return await this.fetchAll({ playername, cache, reqConfig })
	}

	async fetchSince({
		timestamp,
		cache = true,
		reqConfig = {},
	}: {
		timestamp: Date
	} & FetchRequestTypes): Promise<Revocation[]> {
		return await this.fetchAll({ after: timestamp, cache, reqConfig })
	}
}
