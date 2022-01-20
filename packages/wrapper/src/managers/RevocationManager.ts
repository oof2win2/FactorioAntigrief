import "cross-fetch/polyfill"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Revocation } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { GenericAPIError } from ".."
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
		cache = true,
		reqConfig = {}
	}: FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations`,
			{
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
				},
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach(revocation => this.add(revocation))
		return parsed
	}

	async fetchRevocation({
		revocationId,
		cache = true,
		reqConfig = {}
	}: {
		revocationId: string
	} & FetchRequestTypes): Promise<Revocation | null> {
		const revocation = await fetch(
			`${this.apiurl}/revocations/${revocationId}`,
			{
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
				},
			}
		).then((r) => r.json())
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
		reportId: string,
		adminId: string,
	} & FetchRequestTypes): Promise<Revocation> {
		const res = await fetch(
			`${this.apiurl}/revocations/${strictUriEncode(reportId)}`,
			{
				method: "POST",
				body: JSON.stringify({
					adminId: adminId,
				}),
				credentials: "include",
				headers: {
					"content-cype": "application/json",
					"authorization": authenticate(this, reqConfig),
				},
			}
		).then((r) => r.json())
		if (res.error) throw new GenericAPIError(`${res.error}: ${res.message}`)

		const parsed = Revocation.parse(res)
		if (cache) this.add(parsed)
		return parsed
	}
	
	async fetchRule({
		ruleId,
		cache = true,
		reqConfig = {}
	}: {
		ruleId: string
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations/rule/${strictUriEncode(ruleId)}`,
			{
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
				},
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach(revocation => this.add(revocation))
		return parsed
	}

	async revokeRule({
		ruleId,
		adminId,
		cache = true,
		reqConfig = {}
	}: {
		ruleId: string,
		adminId: string,
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations/rule/${strictUriEncode(ruleId)}`,
			{
				method: "POST",
				body: JSON.stringify({
					adminId: adminId
				}),
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
					"content-type": "application/json",
				}
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach(revocation => this.add(revocation))
		return parsed
	}

	async fetchPlayer({
		playername,
		cache = true,
		reqConfig = {}
	}: {
		playername: string
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations/player/${strictUriEncode(playername)}`,
			{
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
				},
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)
		
		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach(revocation => this.add(revocation))
		return parsed
	}

	async revokePlayer({
		playername,
		adminId,
		cache = true,
		reqConfig = {}
	}: {
		playername: string,
		adminId: string,
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations/player/${strictUriEncode(playername)}`,
			{
				method: "POST",
				body: JSON.stringify({
					adminId: adminId
				}),
				credentials: "include",
				headers: {
					authorization: authenticate(this, reqConfig),
					"content-type": "application/json",
				}
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach(revocation => this.add(revocation))
		return parsed
	}

	async fetchSince({
		timestamp,
		cache = true
	}: {
		timestamp: Date,
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${
				this.apiurl
			}/revocations/since/${timestamp.toISOString()}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (revocations.error)
			throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)

		const parsed = z.array(Revocation).parse(revocations)
		if (cache) parsed.forEach(revocation => this.add(revocation))
		return parsed
	}
}
