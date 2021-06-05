import CommunityManager from "./CommunityManager"
import { RuleManager } from "./RuleManager"

export default class FAGCWrapper {
	public readonly apiurl: string
	public apikey: string
	public communities: CommunityManager
	public rules: RuleManager
	constructor(apikey: string) {
		this.apiurl = "http://localhost:3000/v1"
		this.apikey = apikey
		this.communities = new CommunityManager(this.apiurl, this.apikey)
		this.rules = new RuleManager(this.apiurl, this.apikey)
	}
}