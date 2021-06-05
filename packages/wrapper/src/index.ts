import CommunityManager from "./CommunityManager"

export default class FAGCWrapper {
	public readonly apiurl: string
	public apikey: string
	public communities: CommunityManager
	constructor(apikey: string) {
		this.apiurl = "http://localhost:3000/v1"
		this.apikey = apikey
		this.communities = new CommunityManager(this.apiurl, this.apikey)
	}
}