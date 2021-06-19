import Collection from "@discordjs/collection"
import { Common } from "../types/apitypes"
import { AddOptions, ManagerOptions } from "../types/types"

export default class BaseManager<HoldsWithId extends Common> {
	public cache: Collection<Common["id"], HoldsWithId>
	private sweepCache: Collection<Common["id"], number>
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
	add(data: HoldsWithId, cache = true, {id}: AddOptions = {}): HoldsWithId  {
		if (!data) return null
		else if (data.id && cache) {
			this.sweepCache.set(id || data.id, Date.now())
			return this.cache.set(id || data.id, data).get(data.id)
		}
		return data
	}
}