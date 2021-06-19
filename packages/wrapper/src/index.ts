import CommunityManager from "./managers/CommunityManager"
import InfoManager from "./managers/InfoManager"
import OffenseManager from "./managers/OffenseManager"
import RevocationManager from "./managers/RevocationManager"
import { RuleManager } from "./managers/RuleManager"
import { Revocation } from "./types/apitypes"
import { ManagerOptions } from "./types/types"
import ViolationManager from "./managers/ViolationManager"

// export types
export * from "./types/index"

export class FAGCWrapper {
	public readonly apiurl: string
	public apikey: string
	public communities: CommunityManager
	public rules: RuleManager
	public violations: ViolationManager
	public revocations: RevocationManager
	public info: InfoManager
	public offenses: OffenseManager
	constructor(apikey?: string, apiurl?: string, options: ManagerOptions = {
		uncacheage: 1000*60*15,
		uncachems: 1000*60*15
	}) {
		this.apiurl = apiurl || "http://localhost:3000/v1"
		this.apikey = apikey || null

		this.revocations = new RevocationManager(this.apiurl, this.apikey, options)
		this.communities = new CommunityManager(this.apiurl, this.apikey, options)
		this.rules = new RuleManager(this.apiurl, this.apikey, options)
		this.info = new InfoManager(this.apiurl, this.apikey, options)
		this.offenses = new OffenseManager(this.apiurl, this.apikey, options)

		const createCacheRevocation = (revocation: Revocation) => this.revocations.add(revocation)

		this.violations = new ViolationManager(this.apiurl, createCacheRevocation, this.apikey, options)
	}
}