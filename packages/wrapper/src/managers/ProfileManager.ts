import fetch from "isomorphic-fetch"
import { ManagerOptions, WrapperOptions } from "../types/types"
import { Profile, Report, ApiID } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"

export default class ProfileManager extends BaseManager<Report> {
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}
	async fetchCommunity({
		playername, communityId
	}: {
		playername: string
		communityId: ApiID
	}): Promise<Profile> {
		const fetched = await fetch(
			`${this.apiurl}/profiles/fetchcommunity/${strictUriEncode(
				playername
			)}/${strictUriEncode(communityId)}`,
			{
				credentials: "include",
			}
		).then((o) => o.json())
		if (!fetched || !fetched.reports) return fetched

		fetched.reports = fetched.reports.map((report: Report) => {
			report.reportedTime = new Date(report.reportedTime)
			return report
		})
		return fetched
	}
	async fetchAll({ playername }: {playername: string}): Promise<Profile[]> {
		const fetched = await fetch(
			`${this.apiurl}/profiles/fetchall/${strictUriEncode(playername)}`,
			{
				credentials: "include",
			}
		).then((o) => o.json())
		const datedReports = fetched.map((profile) => {
			profile.reports = profile.reports.map((report) => {
				report.reportedTime = new Date(report.reportedTime)
				return report
			})
			return profile
		})
		return datedReports
	}
}
