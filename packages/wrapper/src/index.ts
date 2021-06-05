import CommunityManager from "./CommunityManager"
import { RuleManager } from "./RuleManager"
import { ManagerOptions } from "./types/types"
import ViolationManager from "./ViolationManager"

export default class FAGCWrapper {
	public readonly apiurl: string
	public apikey: string
	public communities: CommunityManager
	public rules: RuleManager
	public violations: ViolationManager
	constructor(apikey: string, options: ManagerOptions = {}) {
		console.log({options})
		this.apiurl = "http://localhost:3000/v1"
		this.apikey = apikey
		this.communities = new CommunityManager(this.apiurl, this.apikey, options)
		this.rules = new RuleManager(this.apiurl, this.apikey, options)
		this.violations = new ViolationManager(this.apiurl, this.apikey, options)
	}
}