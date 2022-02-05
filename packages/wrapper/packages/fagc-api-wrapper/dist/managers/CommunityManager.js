"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("cross-fetch/polyfill");
const assert_1 = require("assert");
const types_1 = require("../types");
const BaseManager_1 = (0, tslib_1.__importDefault)(require("./BaseManager"));
const strict_uri_encode_1 = (0, tslib_1.__importDefault)(require("strict-uri-encode"));
const fagc_api_types_1 = require("fagc-api-types");
const utils_1 = require("../utils");
const zod_1 = require("zod");
class CommunityManager extends BaseManager_1.default {
    constructor(options, managerOptions = {}) {
        super(managerOptions);
        if (options.apikey)
            this.apikey = options.apikey;
        if (options.masterapikey)
            this.masterapikey = options.masterapikey;
        this.apiurl = options.apiurl;
    }
    fetchAll({ cache = true }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const allCommunities = yield fetch(`${this.apiurl}/communities`, {
                credentials: "include",
            }).then((c) => c.json());
            if (allCommunities.error)
                throw new types_1.GenericAPIError(`${allCommunities.error}: ${allCommunities.message}`);
            const parsedCommunities = zod_1.z.array(fagc_api_types_1.Community).parse(allCommunities);
            if (cache)
                parsedCommunities.map((community) => {
                    return this.add(community);
                });
            return parsedCommunities;
        });
    }
    setCommunityConfig({ config, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/communities/own`, {
                method: "PATCH",
                body: JSON.stringify(config),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const update = yield req.json();
            if (update === null || update === void 0 ? void 0 : update.error)
                throw new types_1.GenericAPIError(`${update.error}: ${update.message}`);
            const parsedUpdate = fagc_api_types_1.Community.parse(update);
            if (cache)
                this.add(parsedUpdate);
            return parsedUpdate;
        });
    }
    getCommunityConfig({ communityId, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return this.fetchCommunity({ communityId, cache, reqConfig });
        });
    }
    fetchCommunity({ communityId, cache = true, force = false }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            if (!force) {
                const cached = this.cache.get(communityId) ||
                    this.fetchingCache.get(communityId);
                if (cached)
                    return cached;
            }
            let promiseResolve;
            const fetchingPromise = new Promise((resolve) => {
                promiseResolve = resolve;
            });
            this.fetchingCache.set(communityId, fetchingPromise);
            const fetched = yield fetch(`${this.apiurl}/communities/${(0, strict_uri_encode_1.default)(communityId)}`, {
                credentials: "include",
            }).then((c) => c.json());
            if (!fetched) {
                promiseResolve(null);
                setTimeout(() => this.fetchingCache.delete(communityId), 0);
                return null; // return null if the fetch is empty
            }
            if (fetched.error) {
                promiseResolve(null);
                setTimeout(() => this.fetchingCache.delete(communityId), 0);
                throw new types_1.GenericAPIError(`${fetched.error}: ${fetched.message}`);
            }
            const communityParsed = fagc_api_types_1.Community.safeParse(fetched);
            if (!communityParsed.success || communityParsed.data === null) {
                promiseResolve(null);
                setTimeout(() => this.fetchingCache.delete(communityId), 0);
                if (!communityParsed.success)
                    throw communityParsed.error;
                return null;
            }
            if (cache)
                this.add(communityParsed.data);
            promiseResolve(communityParsed.data);
            setTimeout(() => this.fetchingCache.delete(communityId), 0);
            return communityParsed.data;
        });
    }
    fetchOwnCommunity({ cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/communities/own`, {
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const community = yield req.json();
            if (!community)
                return null;
            if (community.error)
                throw new types_1.GenericAPIError(`${community.error}: ${community.message}`);
            const parsedCommunity = fagc_api_types_1.Community.parse(community);
            if (cache)
                this.add(parsedCommunity);
            return parsedCommunity;
        });
    }
    setGuildConfig({ config, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/discord/guilds/${config.guildId}`, {
                method: "PATCH",
                body: JSON.stringify(config),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const update = yield req.json();
            if (update.error)
                throw new types_1.GenericAPIError(`${update.error}: ${update.message}`);
            const parsedUpdate = fagc_api_types_1.GuildConfig.parse(update);
            return parsedUpdate;
        });
    }
    setGuildConfigMaster({ config, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/discord/guilds/${config.guildId}`, {
                method: "PATCH",
                body: JSON.stringify(config),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const update = yield req.json();
            if (update.error)
                throw new types_1.GenericAPIError(`${update.error}: ${update.message}`);
            const parsedUpdate = fagc_api_types_1.GuildConfig.parse(update);
            return parsedUpdate;
        });
    }
    fetchGuildConfig({ guildId, }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const config = yield fetch(`${this.apiurl}/discord/guilds/${(0, strict_uri_encode_1.default)(guildId)}`, {
                credentials: "include",
            }).then((c) => c.json());
            if (config === null || config === void 0 ? void 0 : config.error)
                throw new types_1.GenericAPIError(`${config.error}: ${config.message}`);
            const parsedConfig = fagc_api_types_1.GuildConfig.parse(config);
            return parsedConfig;
        });
    }
    fetchGuildConfigMaster({ guildId, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/discord/guilds/${(0, strict_uri_encode_1.default)(guildId)}`, {
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                }
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const config = yield req.json();
            if (config === null || config === void 0 ? void 0 : config.error)
                throw new types_1.GenericAPIError(`${config.error}: ${config.message}`);
            const parsedConfig = fagc_api_types_1.GuildConfig.parse(config);
            return parsedConfig;
        });
    }
    /**
     * Manage API key for your community
     */
    manageApikey({ create, invalidate, reqConfig = {}, }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/communites/own/apikey`, {
                method: "POST",
                body: JSON.stringify({
                    create,
                    invalidate,
                }),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const key = yield req.json();
            if (key.error)
                throw new types_1.GenericAPIError(`${key.error}: ${key.message}`);
            const parsed = zod_1.z.object({
                apikey: zod_1.z.string().optional(),
            }).parse(key);
            return parsed;
        });
    }
    /**
     * Create a new API key for your community
     */
    createApikey({ reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const result = yield this.manageApikey({ create: true, reqConfig });
            (0, assert_1.strict)(result.apikey);
            return result.apikey;
        });
    }
    /**
     * Revoke all currently valid API keys created
     * @returns New API key to use
     */
    revokeApikeys({ reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const result = yield this.manageApikey({ create: true, invalidate: true, reqConfig });
            (0, assert_1.strict)(result.apikey);
            return result.apikey;
        });
    }
    /**
     * Manage an API key for a community with the use of the master API
     */
    masterManageApikey({ communityId, create, keyType = "private", invalidate, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/communities/${(0, strict_uri_encode_1.default)(communityId)}/apikey`, {
                method: "POST",
                body: JSON.stringify(Object.assign(Object.assign({ create }, (create ? { type: keyType } : {})), { invalidate })),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const key = yield req.json();
            if (key.error)
                throw new types_1.GenericAPIError(`${key.error}: ${key.message}`);
            const parsed = zod_1.z.object({
                apikey: zod_1.z.string().optional(),
            }).parse(key);
            return parsed;
        });
    }
    /**
     * Create an API key for a community with the use of the master API
     */
    masterCreateKey({ communityId, keyType = "private", reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const result = yield this.masterManageApikey({ communityId, create: true, keyType, reqConfig });
            (0, assert_1.strict)(result.apikey);
            return result.apikey;
        });
    }
    /**
     * Revoke all currently valid API keys created for community
     * @returns New API key to use
     */
    masterRevokeKeys({ communityId, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const result = yield this.masterManageApikey({ communityId, create: true, invalidate: true, reqConfig });
            (0, assert_1.strict)(result.apikey);
            return result.apikey;
        });
    }
    create({ name, contact, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/communities`, {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    contact: contact,
                }),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const create = yield req.json();
            if (create === null || create === void 0 ? void 0 : create.error)
                throw new types_1.GenericAPIError(`${create.error}: ${create.message}`);
            const parsedCreate = zod_1.z.object({
                community: fagc_api_types_1.Community,
                apikey: zod_1.z.string(),
            }).parse(create);
            if (cache)
                this.add(parsedCreate.community);
            return parsedCreate;
        });
    }
    createGuildConfig({ guildId, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/discord/guilds`, {
                method: "POST",
                body: JSON.stringify({
                    guildId: guildId,
                }),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const create = yield req.json();
            if (create.error)
                throw new types_1.GenericAPIError(`${create.error}: ${create.message}`);
            const parsedCreate = fagc_api_types_1.GuildConfig.parse(create);
            return parsedCreate;
        });
    }
    notifyGuildConfigChanged({ guildId, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/discord/guilds/${(0, strict_uri_encode_1.default)(guildId)}/notifyChanged`, {
                method: "POST",
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const create = yield req.json();
            if (create === null || create === void 0 ? void 0 : create.error)
                throw new types_1.GenericAPIError(`${create.error}: ${create.message}`);
        });
    }
    guildLeave({ guildId, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/discord/guilds/${(0, strict_uri_encode_1.default)(guildId)}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const create = yield req.json();
            if (create === null || create === void 0 ? void 0 : create.error)
                throw new types_1.GenericAPIError(`${create.error}: ${create.message}`);
        });
    }
    remove({ communityId, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/communities/${(0, strict_uri_encode_1.default)(communityId)}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const remove = yield req.json();
            if (remove === null || remove === void 0 ? void 0 : remove.error)
                throw new types_1.GenericAPIError(`${remove.error}: ${remove.message}`);
            this.removeFromCache({
                id: communityId,
            });
            return zod_1.z.boolean().parse(remove);
        });
    }
    merge({ idReceiving, idDissolving, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/communities/${(0, strict_uri_encode_1.default)(idReceiving)}/merge/${(0, strict_uri_encode_1.default)(idDissolving)}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const merge = yield req.json();
            if (merge === null || merge === void 0 ? void 0 : merge.error)
                throw new types_1.GenericAPIError(`${merge.error}: ${merge.message}`);
            this.removeFromCache({ id: idDissolving });
            return fagc_api_types_1.Community.parse(merge);
        });
    }
}
exports.default = CommunityManager;
//# sourceMappingURL=CommunityManager.js.map