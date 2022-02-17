import Collection from "@discordjs/collection"
import { Common } from "fagc-api-types"
import { AddOptions, ManagerOptions } from "../types/types"

export default class BaseManager<HoldsWithId extends Common> {
	public apiurl!: string // will be assigned when it is extended
	public cache: Collection<Common["id"], HoldsWithId>
	protected fetchingCache: Collection<
		Common["id"],
		Promise<HoldsWithId | null>
	>
	private sweepCache: Collection<Common["id"], number>
	private interval: NodeJS.Timeout
	public apikey?: string | null = null
	public masterapikey: string | null = null
	constructor(options: ManagerOptions = {}) {
		this.cache = new Collection()
		this.sweepCache = new Collection()
		this.fetchingCache = new Collection()

		if (options.uncachems) {
			this.interval = setInterval(() => {
				this.sweepCache.forEach((addedAt, id) => {
					// if the age of addition + custom age (or 60mins) is larger than now then remove it
					if (
						addedAt + (options.uncacheage || 1000 * 60 * 60) <
						Date.now()
					) {
						this.sweepCache.sweep((_, item) => item === id)
						this.cache.sweep((_, item) => item === id)
					}
				})
			}, options.uncachems)
		} else {
			this.interval = setInterval(this.sweepCache.clear, 1000 * 60 * 15) // clear sweeping cache every 15 mins if its not used properly
		}
	}
	protected add(
		data: HoldsWithId,
		cache = true,
		{ id }: AddOptions = {}
	): HoldsWithId | null {
		if (!data) return null
		else if (data.id && cache) {
			this.sweepCache.set(id || data.id, Date.now())
			return this.cache.set(id || data.id, data).get(data.id) ?? null
		}
		return data
	}
	protected removeFromCache(
		data: Pick<HoldsWithId, "id">
	): Pick<HoldsWithId, "id"> | null {
		if (!data) return null
		this.cache.delete(data.id)
		this.sweepCache.delete(data.id)
		const value = this.fetchingCache.get(data.id)
		if (value) {
			value.then(() => {
				this.cache.delete(data.id)
			})
		}
		return data
	}

	clearCache(): void {
		this.cache.clear()
		this.sweepCache.clear()
		this.fetchingCache.clear()
	}

	resolveId(id: Common["id"]): HoldsWithId | null {
		const cached = this.cache.get(id)
		if (cached) return cached
		return null
	}

	destroy(): void {
		clearInterval(this.interval)
		this.apikey = null
		this.masterapikey = null
	}
}
