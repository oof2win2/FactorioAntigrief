import Collection from "@discordjs/collection"
import { ManagerOptions } from "./types/types"

export default class BaseManager<K, Holds> {
	public cache: Collection<K, Holds>
	private sweepCache: Collection<K, number>
	constructor(options: ManagerOptions = {}) {
		this.cache = new Collection()
		this.sweepCache = new Collection()

		if (options.uncachems) {
			setInterval(() => {
				this.sweepCache.forEach((addedAt, id) => {
					// if the age of addition + custom age (or 60mins) is larger than now then remove it
					if (addedAt + (options.uncacheage || 1000*60*60) < Date.now()) {
						this.sweepCache.sweep((_, item) => item === id)
						this.cache.sweep((_, item) => item === id)
					}
				})
			}, options.uncachems)
		} else {
			setInterval(this.sweepCache.clear, 1000*60*15) // clear sweeping cache every 15 mins if its not used properly
		}
	}
	add(data: any, cache: boolean = true) {
		if (!data) return null
		else if (data.id && cache) {
			this.sweepCache.set(data.id, Date.now())
			return this.cache.set(data.id, data).get(data.id)
		}
		return data
	}
}