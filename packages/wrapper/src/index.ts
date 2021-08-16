import CommunityManager from "./managers/CommunityManager"
import InfoManager from "./managers/InfoManager"
import ProfileManager from "./managers/ProfileManager"
import RevocationManager from "./managers/RevocationManager"
import { RuleManager } from "./managers/RuleManager"
import { ManagerOptions, WrapperOptions } from "./types/types"
import ReportManager from "./managers/ReportManager"
import WebSocketHandler from "./WebsocketListener"
import { Revocation } from "fagc-api-types"

// export types
export * from "./types/index"

export class FAGCWrapper {
	public readonly apiurl: string
	public apikey?: string
	public masterapikey?: string
	public communities: CommunityManager
	public rules: RuleManager
	public reports: ReportManager
	public revocations: RevocationManager
	public info: InfoManager
	public profiles: ProfileManager
	public websocket: WebSocketHandler

	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {
		uncacheage: 1000*60*15,
		uncachems: 1000*60*15
	}) {
		this.apiurl = options.apiurl
		this.apikey = options.apikey
		this.masterapikey = options.masterapikey

		this.revocations = new RevocationManager(options, managerOptions)
		this.communities = new CommunityManager(options, managerOptions)
		this.rules = new RuleManager(options, managerOptions)
		this.info = new InfoManager(options, managerOptions)
		this.profiles = new ProfileManager(options, managerOptions)

		const createCacheRevocation = (revocation: Revocation) => this.revocations.addRevocation(revocation)
		this.reports = new ReportManager(options, createCacheRevocation, managerOptions)

		
		this.websocket = new WebSocketHandler({
			uri: options.socketurl,
			enabled: options.enableWebSocket
		})
	}
	destroy(): void {
		this.apikey = null
		this.masterapikey = null

		this.reports.destroy()
		this.rules.destroy()
		this.communities.destroy()
		this.revocations.destroy()
		this.profiles.destroy()
		this.info.destroy()
		this.websocket.destroy()
	}
}