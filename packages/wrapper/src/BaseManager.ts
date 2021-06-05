import Collection from "@discordjs/collection"

export default class BaseManager<K, Holds> {
	public cache: Collection<K, Holds>
	constructor() {
		this.cache = new Collection()
	}
	add(data: any, cache: boolean = true) {
		if (!data) return null
		if (data.id && cache) return this.cache.set(data.id, data).get(data.id)
		return data
	}
}