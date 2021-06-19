import CommunityManager from "./managers/CommunityManager"
import InfoManager from "./managers/InfoManager"
import OffenseManager from "./managers/OffenseManager"
import RevocationManager from "./managers/RevocationManager"
import { RuleManager } from "./managers/RuleManager"
import { Revocation } from "./types/apitypes"
import { ManagerOptions, WrapperOptions } from "./types/types"
import ReportManager from "./managers/ReportManager"
import WebSocketHandler from "./WebsocketListener"

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
	public offenses: OffenseManager
	public websocket: WebSocketHandler

	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {
		uncacheage: 1000*60*15,
		uncachems: 1000*60*15
	}) {
		this.apiurl = options.apiurl || "http://localhost:3000/v1"
		this.apikey = options.apikey || null

		this.revocations = new RevocationManager(this.apiurl, this.apikey, managerOptions)
		this.communities = new CommunityManager(this.apiurl, this.apikey, managerOptions)
		this.rules = new RuleManager(this.apiurl, this.apikey, managerOptions)
		this.info = new InfoManager(this.apiurl, this.apikey, managerOptions)
		this.offenses = new OffenseManager(this.apiurl, this.apikey, managerOptions)

		const createCacheRevocation = (revocation: Revocation) => this.revocations.add(revocation)
		this.reports = new ReportManager(this.apiurl, createCacheRevocation, this.apikey, managerOptions)

		
		this.websocket = new WebSocketHandler({
			uri: options.socketurl
		})
	}
}