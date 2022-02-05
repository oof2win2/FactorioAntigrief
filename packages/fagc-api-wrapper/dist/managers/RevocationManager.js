"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("cross-fetch/polyfill");
const fagc_api_types_1 = require("fagc-api-types");
const BaseManager_1 = (0, tslib_1.__importDefault)(require("./BaseManager"));
const strict_uri_encode_1 = (0, tslib_1.__importDefault)(require("strict-uri-encode"));
const __1 = require("..");
const utils_1 = require("../utils");
const zod_1 = require("zod");
class RevocationManager extends BaseManager_1.default {
    constructor(options, managerOptions = {}) {
        super(managerOptions);
        if (options.apikey)
            this.apikey = options.apikey;
        this.apiurl = options.apiurl;
    }
    fetchAll({ playername, categoryId, adminId, after, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const url = new URL("./revocations", this.apiurl);
            function addParams(name, values) {
                if (values === undefined)
                    values = [];
                if (!(values instanceof Array))
                    values = [values];
                values.forEach((v) => url.searchParams.append(name, v));
            }
            addParams("playername", playername);
            addParams("categoryId", categoryId);
            addParams("adminId", adminId);
            if (after)
                url.searchParams.set("after", after.toISOString());
            const req = yield fetch(url.toString(), {
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new __1.AuthError();
            const revocations = yield req.json();
            if (revocations.error)
                throw new __1.GenericAPIError(`${revocations.error}: ${revocations.message}`);
            const parsed = zod_1.z.array(fagc_api_types_1.Revocation).parse(revocations);
            if (cache)
                parsed.forEach(revocation => this.add(revocation));
            return parsed;
        });
    }
    fetchRevocation({ revocationId, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/revocations/${revocationId}`, {
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new __1.AuthError();
            const revocation = yield req.json();
            if (!revocation)
                return null;
            const parsed = fagc_api_types_1.Revocation.parse(revocation);
            if (cache)
                this.add(parsed);
            return parsed;
        });
    }
    revoke({ reportId, adminId, cache = true, reqConfig = {}, }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/revocations`, {
                method: "POST",
                body: JSON.stringify({
                    reportId: reportId,
                    adminId: adminId,
                }),
                credentials: "include",
                headers: {
                    "content-type": "application/json",
                    "authorization": (0, utils_1.authenticate)(this, reqConfig),
                },
            });
            if (req.status === 401)
                throw new __1.AuthError();
            const revocation = yield req.json();
            if (revocation.error)
                throw new __1.GenericAPIError(`${revocation.error}: ${revocation.message}`);
            const parsed = fagc_api_types_1.Revocation.parse(revocation);
            if (cache)
                this.add(parsed);
            return parsed;
        });
    }
    revokeCategory({ categoryId, adminId, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/revocations/category/${(0, strict_uri_encode_1.default)(categoryId)}`, {
                method: "POST",
                body: JSON.stringify({
                    adminId: adminId
                }),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                    "content-type": "application/json",
                }
            });
            if (req.status === 401)
                throw new __1.AuthError();
            const revocations = yield req.json();
            if (revocations.error)
                throw new __1.GenericAPIError(`${revocations.error}: ${revocations.message}`);
            const parsed = zod_1.z.array(fagc_api_types_1.Revocation).parse(revocations);
            if (cache)
                parsed.forEach(revocation => this.add(revocation));
            return parsed;
        });
    }
    revokePlayer({ playername, adminId, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/revocations/player/${(0, strict_uri_encode_1.default)(playername)}`, {
                method: "POST",
                body: JSON.stringify({
                    adminId: adminId
                }),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                    "content-type": "application/json",
                }
            });
            if (req.status === 401)
                throw new __1.AuthError();
            const revocations = yield req.json();
            if (revocations.error)
                throw new __1.GenericAPIError(`${revocations.error}: ${revocations.message}`);
            const parsed = zod_1.z.array(fagc_api_types_1.Revocation).parse(revocations);
            if (cache)
                parsed.forEach(revocation => this.add(revocation));
            return parsed;
        });
    }
    // Obsolete accessors
    fetchCategory({ categoryId, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ categoryId, cache, reqConfig });
        });
    }
    fetchPlayer({ playername, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ playername, cache, reqConfig });
        });
    }
    fetchSince({ timestamp, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ after: timestamp, cache, reqConfig });
        });
    }
}
exports.default = RevocationManager;
//# sourceMappingURL=RevocationManager.js.map