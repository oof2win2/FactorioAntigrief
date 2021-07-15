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
	public apikey: string
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

		this.revocations = new RevocationManager(this.apiurl, this.apikey, managerOptions)
		this.communities = new CommunityManager(this.apiurl, this.apikey, managerOptions)
		this.rules = new RuleManager(this.apiurl, this.apikey, managerOptions)
		this.info = new InfoManager(this.apiurl, this.apikey, managerOptions)
		this.profiles = new ProfileManager(this.apiurl, this.apikey, managerOptions)

		const createCacheRevocation = (revocation: Revocation) => this.revocations.add(revocation)
		this.reports = new ReportManager(this.apiurl, createCacheRevocation, this.apikey, managerOptions)

		
		this.websocket = new WebSocketHandler({
			uri: options.socketurl,
			enabled: options.enableWebSocket
		})
	}
}