import CommunityManager from "./managers/CommunityManager"
import InfoManager from "./managers/InfoManager"
import RevocationManager from "./managers/RevocationManager"
import { RuleManager } from "./managers/RuleManager"
import { ManagerOptions, BaseWrapperOptions, WrapperOptions } from "./types/types"
import ReportManager from "./managers/ReportManager"
import WebSocketHandler from "./WebsocketListener"
import { Revocation } from "fagc-api-types"

// export types
export * from "./types/index"

export class FAGCWrapper {
	public readonly apiurl: string
	public apikey?: string | null = null
	public masterapikey?: string | null = null
	public communities: CommunityManager
	public rules: RuleManager
	public reports: ReportManager
	public revocations: RevocationManager
	public info: InfoManager
	public websocket: WebSocketHandler

	constructor(
		baseOptions: BaseWrapperOptions = {},
		managerOptions: ManagerOptions = {
			uncacheage: 1000 * 60 * 15,
			uncachems: 1000 * 60 * 15,
		}
	) {
		const options: WrapperOptions = {
			apiurl: "https://factoriobans.club/api",
			socketurl: "https://factoriobans.club/api/ws",
			...baseOptions
		}
		if (!options.apiurl) options.apiurl = "https://factoriobans.club/api"
		if (!options.socketurl) options.socketurl = "https://factoriobans.club/api/ws"

		this.apiurl = options.apiurl
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey

		this.revocations = new RevocationManager(options, managerOptions)
		this.communities = new CommunityManager(options, managerOptions)
		this.rules = new RuleManager(options, managerOptions)
		this.info = new InfoManager(options, managerOptions)
		this.reports = new ReportManager(options, managerOptions)

		this.websocket = new WebSocketHandler({
			uri: options.socketurl || "wss://factoriobans.club/api/ws",
			enabled: options.enableWebSocket,
		})
	}
	destroy(): void {
		Object.keys(this).forEach((key) => {
			if (
				typeof this[key] == "object" &&
				this[key] !== null &&
				typeof this[key]["destroy"] == "function"
			)
				this[key]["destroy"]()
		})

		this.apikey = null
		this.masterapikey = null
	}
	setdata({
		apikey, masterapikey,
		url, socketurl,
	}: {
		apikey?: string | null,
		masterapikey?: string | null,
		url?: string,
		socketurl?: string
	}): void {
		if (apikey || apikey === null) {
			this.revocations.apikey = apikey
			this.communities.apikey = apikey
			this.rules.apikey = apikey
			this.info.apikey = apikey
			this.reports.apikey = apikey
		}
		if (masterapikey || masterapikey === null) {
			this.revocations.masterapikey = masterapikey
			this.communities.masterapikey = masterapikey
			this.rules.masterapikey = masterapikey
			this.info.masterapikey = masterapikey
			this.reports.masterapikey = masterapikey
		}
		if (url) {
			this.revocations.apiurl = url
			this.communities.apiurl = url
			this.rules.apiurl = url
			this.info.apiurl = url
			this.reports.apiurl = url
		}
		if (socketurl) this.websocket.setUrl(socketurl)
	}
}
