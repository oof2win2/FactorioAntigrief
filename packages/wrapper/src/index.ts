import CommunityManager from "./CommunityManager"
import RevocationManager from "./RevocationManager"
import { RuleManager } from "./RuleManager"
import { ManagerOptions } from "./types/types"
import ViolationManager from "./ViolationManager"

export default class FAGCWrapper {
	public readonly apiurl: string
	public apikey: string
	public communities: CommunityManager
	public rules: RuleManager
	public violations: ViolationManager
	public revocations: RevocationManager
	constructor(apikey: string, options: ManagerOptions = {
		uncacheage: 1000*60*15,
		uncachems: 1000*60*15
	}) {
		this.apiurl = "http://localhost:3000/v1"
		this.apikey = apikey

		this.revocations = new RevocationManager(this.apiurl, this.apikey, options)
		this.communities = new CommunityManager(this.apiurl, this.apikey, options)
		this.rules = new RuleManager(this.apiurl, this.apikey, options)

		const createCacheRevocation = (revocation) => this.revocations.add(revocation)

		this.violations = new ViolationManager(this.apiurl, createCacheRevocation, this.apikey, options)
	}
}