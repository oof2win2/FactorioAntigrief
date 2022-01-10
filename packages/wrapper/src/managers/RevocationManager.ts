import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Revocation, ApiID } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { GenericAPIError } from ".."
import { FetchRequestTypes } from "../types/privatetypes"
import { Authenticate } from "../utils"

export default class RevocationManager extends BaseManager<Revocation> {	
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}

	@Authenticate()
	async fetchAll({
		cache = true,
		reqConfig = {}
	}: FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations`,
			{
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)

		revocations.forEach((revocation: Revocation) => {
			revocation.reportedTime = new Date(revocation.reportedTime)
			revocation.revokedTime = new Date(revocation.revokedTime)
			if (cache) this.add(revocation)
		})
		return revocations
	}

	@Authenticate()
	async fetchRevocation({
		id,
		cache = true,
		reqConfig = {}
	}: {
		id: string
	} & FetchRequestTypes): Promise<Revocation | null> {
		const revocation = await fetch(
			`${this.apiurl}/revocations/${id}`,
			{
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((r) => r.json())
		if (!revocation) return null
		revocation.reportedTime = new Date(revocation.reportedTime)
		revocation.revokedTime = new Date(revocation.revokedTime)
		if (cache) this.add(revocation)
		return revocation
	}

	@Authenticate()
	async revoke({
		reportId,
		adminId,
		cache = true,
		reqConfig = {},
	}: {
		reportId: ApiID,
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
					"authorization": `${reqConfig._keystring}`,
				},
			}
		).then((r) => r.json())
		if (res.error) throw new GenericAPIError(`${res.error}: ${res.message}`)
		res.reportedTime = new Date(res.reportedTime)
		res.revokedTime = new Date(res.revokedTime)
		if (cache) this.add(res)
		return res
	}

	@Authenticate()
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
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)
		revocations.forEach((revocation: Revocation) => {
			revocation.reportedTime = new Date(revocation.reportedTime)
			revocation.revokedTime = new Date(revocation.revokedTime)
			if (cache) this.add(revocation)
		})
		return revocations
	}

	@Authenticate()
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
				body: JSON.stringify({
					adminId: adminId
				}),
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
					"content-type": "application/json",
				}
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)

		revocations.forEach((revocation: Revocation) => {
			revocation.reportedTime = new Date(revocation.reportedTime)
			revocation.revokedTime = new Date(revocation.revokedTime)
			if (cache) this.add(revocation)
		})
		return revocations
	}

	@Authenticate()
	async fetchRule({
		ruleId,
		cache = true,
		reqConfig = {}
	}: {
		ruleId: ApiID
	} & FetchRequestTypes): Promise<Revocation[]> {
		const revocations = await fetch(
			`${this.apiurl}/revocations/rule/${strictUriEncode(ruleId)}`,
			{
				credentials: "include",
				headers: {
					authorization: `${reqConfig._keystring}`,
				},
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)
		revocations.forEach((revocation: Revocation) => {
			revocation.reportedTime = new Date(revocation.reportedTime)
			revocation.revokedTime = new Date(revocation.revokedTime)
			if (cache) this.add(revocation)
		})
		return revocations
	}

	@Authenticate()
	async revokeRule({
		ruleId,
		adminId,
		cache = true,
		reqConfig = {}
	}: {
		ruleId: ApiID,
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
					authorization: `${reqConfig._keystring}`,
					"content-type": "application/json",
				}
			}
		).then((r) => r.json())
		if (revocations.error) throw new GenericAPIError(`${revocations.error}: ${revocations.message}`)
		revocations.forEach((revocation: Revocation) => {
			revocation.reportedTime = new Date(revocation.reportedTime)
			revocation.revokedTime = new Date(revocation.revokedTime)
			if (cache) this.add(revocation)
		})
		return revocations
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

		revocations.forEach((revocation) => {
			revocation.reportedTime = new Date(revocation.reportedTime)
			revocation.timestamp = new Date(revocation.timestamp)
			if (cache) this.add(revocation)
		})
		return revocations
	}
}
