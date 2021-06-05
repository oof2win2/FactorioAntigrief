import CommunityManager from "./CommunityManager"

export default class FAGCWrapper {
	public readonly apiurl: string
	public apikey: string
	public communities: CommunityManager
	constructor(apikey: string) {
		this.apiurl = "localhost:3001"
		this.apikey = apikey
		this.communities = new CommunityManager(this.apiurl, this.apikey)
	}
}