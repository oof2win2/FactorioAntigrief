"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryManager = void 0;
const tslib_1 = require("tslib");
require("cross-fetch/polyfill");
const fagc_api_types_1 = require("fagc-api-types");
const BaseManager_1 = (0, tslib_1.__importDefault)(require("./BaseManager"));
const strict_uri_encode_1 = (0, tslib_1.__importDefault)(require("strict-uri-encode"));
const types_1 = require("../types");
const utils_1 = require("../utils");
const zod_1 = require("zod");
class CategoryManager extends BaseManager_1.default {
    constructor(options, managerOptions = {}) {
        super(managerOptions);
        this.apiurl = options.apiurl;
        if (options.apikey)
            this.apikey = options.apikey;
        if (options.masterapikey)
            this.masterapikey = options.masterapikey;
    }
    fetchAll({ cache = true }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/categories`, {
                credentials: "include",
            });
            const allCategories = yield req.json();
            const parsed = zod_1.z.array(fagc_api_types_1.Category).parse(allCategories);
            if (cache)
                parsed.map(category => this.add(category));
            return parsed;
        });
    }
    create({ category, cache = true, reqConfig = {}, }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/categories`, {
                method: "POST",
                body: JSON.stringify(category),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const data = yield req.json();
            if (data.error)
                throw new types_1.GenericAPIError(`${data.error}: ${data.message}`);
            const parsed = fagc_api_types_1.Category.parse(data);
            if (cache)
                this.add(parsed);
            return parsed;
        });
    }
    fetchCategory({ categoryId, cache = true, force = false }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            if (!force) {
                const cached = this.cache.get(categoryId) || this.fetchingCache.get(categoryId);
                if (cached)
                    return cached;
            }
            let promiseResolve;
            const fetchingPromise = new Promise((resolve) => {
                promiseResolve = resolve;
            });
            if (cache)
                this.fetchingCache.set(categoryId, fetchingPromise);
            const req = yield fetch(`${this.apiurl}/categories/${(0, strict_uri_encode_1.default)(categoryId)}`, {
                credentials: "include",
            });
            const fetched = yield req.json();
            const parsed = fagc_api_types_1.Category.nullable().safeParse(fetched);
            if (!parsed.success || parsed.data === null) {
                promiseResolve(null);
                setTimeout(() => this.fetchingCache.delete(categoryId), 0);
                if (!parsed.success)
                    throw parsed.error;
                return null;
            }
            if (cache)
                this.add(parsed.data);
            promiseResolve(fetched);
            setTimeout(() => {
                this.fetchingCache.delete(categoryId);
            }, 0);
            return parsed.data;
        });
    }
    modify({ categoryId, name, description, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/categories/${(0, strict_uri_encode_1.default)(categoryId)}`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({
                    name: name,
                    description: description
                }),
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const data = yield req.json();
            if (data.error)
                throw new types_1.GenericAPIError(`${data.error}: ${data.message}`);
            const parsed = fagc_api_types_1.Category.parse(data);
            // remove old category from cache and add new category
            this.removeFromCache(parsed);
            this.add(parsed);
            return parsed;
        });
    }
    remove({ categoryId, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/categories/${(0, strict_uri_encode_1.default)(categoryId)}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const data = yield req.json();
            if (data.error)
                throw new types_1.GenericAPIError(`${data.error}: ${data.message}`);
            const parsed = fagc_api_types_1.Category.parse(data);
            this.removeFromCache(parsed);
            return parsed;
        });
    }
    merge({ idReceiving, idDissolving, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/categories/${(0, strict_uri_encode_1.default)(idReceiving)}/merge/${(0, strict_uri_encode_1.default)(idDissolving)}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const data = yield req.json();
            if (data.error)
                throw new types_1.GenericAPIError(`${data.error}: ${data.message}`);
            const parsed = fagc_api_types_1.Category.parse(data);
            this.removeFromCache({ id: idDissolving });
            return parsed;
        });
    }
}
exports.CategoryManager = CategoryManager;
//# sourceMappingURL=CategoryManager.js.map