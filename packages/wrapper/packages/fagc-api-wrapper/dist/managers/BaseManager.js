"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const collection_1 = (0, tslib_1.__importDefault)(require("@discordjs/collection"));
class BaseManager {
    constructor(options = {}) {
        this.apikey = null;
        this.masterapikey = null;
        this.cache = new collection_1.default();
        this.sweepCache = new collection_1.default();
        this.fetchingCache = new collection_1.default();
        if (options.uncachems) {
            this.interval = setInterval(() => {
                this.sweepCache.forEach((addedAt, id) => {
                    // if the age of addition + custom age (or 60mins) is larger than now then remove it
                    if (addedAt + (options.uncacheage || 1000 * 60 * 60) <
                        Date.now()) {
                        this.sweepCache.sweep((_, item) => item === id);
                        this.cache.sweep((_, item) => item === id);
                    }
                });
            }, options.uncachems);
        }
        else {
            this.interval = setInterval(this.sweepCache.clear, 1000 * 60 * 15); // clear sweeping cache every 15 mins if its not used properly
        }
    }
    add(data, cache = true, { id } = {}) {
        var _a;
        if (!data)
            return null;
        else if (data.id && cache) {
            this.sweepCache.set(id || data.id, Date.now());
            return (_a = this.cache.set(id || data.id, data).get(data.id)) !== null && _a !== void 0 ? _a : null;
        }
        return data;
    }
    removeFromCache(data) {
        if (!data)
            return null;
        this.cache.delete(data.id);
        this.sweepCache.delete(data.id);
        const value = this.fetchingCache.get(data.id);
        if (value) {
            value.then(() => {
                this.cache.delete(data.id);
            });
        }
        return data;
    }
    clearCache() {
        this.cache.clear();
        this.sweepCache.clear();
        this.fetchingCache.clear();
    }
    resolveId(id) {
        const cached = this.cache.get(id);
        if (cached)
            return cached;
        return null;
    }
    destroy() {
        clearInterval(this.interval);
        this.apikey = null;
        this.masterapikey = null;
    }
}
exports.default = BaseManager;
//# sourceMappingURL=BaseManager.js.map