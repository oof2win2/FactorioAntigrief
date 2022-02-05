"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("cross-fetch/polyfill");
const types_1 = require("../types");
const fagc_api_types_1 = require("fagc-api-types");
const BaseManager_1 = (0, tslib_1.__importDefault)(require("./BaseManager"));
const strict_uri_encode_1 = (0, tslib_1.__importDefault)(require("strict-uri-encode"));
const utils_1 = require("../utils");
const zod_1 = require("zod");
class ReportManager extends BaseManager_1.default {
    constructor(options, managerOptions = {}) {
        super(managerOptions);
        if (options.apikey)
            this.apikey = options.apikey;
        this.apiurl = options.apiurl;
    }
    fetchAll({ playername, communityId, categoryId, adminId, after, cache = true, }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const url = new URL("./reports", this.apiurl);
            function addParams(name, values) {
                if (values === undefined)
                    values = [];
                if (!(values instanceof Array))
                    values = [values];
                values.forEach((v) => url.searchParams.append(name, v));
            }
            addParams("playername", playername);
            addParams("communityId", communityId);
            addParams("categoryId", categoryId);
            addParams("adminId", adminId);
            if (after)
                url.searchParams.set("after", after.toISOString());
            const reports = yield fetch(url.toString(), {
                credentials: "include",
            }).then((c) => c.json());
            if (reports.error)
                throw new types_1.GenericAPIError(`${reports.error}: ${reports.message}`);
            const parsedReports = zod_1.z.array(fagc_api_types_1.Report).parse(reports);
            if (cache)
                parsedReports.forEach((report) => this.add(report));
            return reports;
        });
    }
    create({ report, cache = true, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const req = yield fetch(`${this.apiurl}/reports`, {
                method: "POST",
                body: JSON.stringify(report),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.authenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
            if (req.status === 401)
                throw new types_1.AuthError();
            const create = yield req.json();
            if (create.error)
                throw new types_1.GenericAPIError(`${create.error}: ${create.message}`);
            const parsedCreate = fagc_api_types_1.Report.parse(create);
            if (cache)
                this.add(parsedCreate);
            return parsedCreate;
        });
    }
    fetchReport({ reportId, cache = true, force = false }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            if (!force) {
                const cached = this.cache.get(reportId) || this.fetchingCache.get(reportId);
                if (cached)
                    return cached;
            }
            // this is so that if another fetch is created for this same report whilst the first one is still running, it will not execute another fetch
            // rather it will make it wait for the first one to finish and then return it
            let promiseResolve;
            const fetchingPromise = new Promise((resolve) => {
                promiseResolve = resolve;
            });
            this.fetchingCache.set(reportId, fetchingPromise);
            const fetched = yield fetch(`${this.apiurl}/reports/${(0, strict_uri_encode_1.default)(reportId)}`, {
                credentials: "include",
            }).then((c) => c.json());
            if (!fetched) {
                promiseResolve(null);
                setTimeout(() => this.fetchingCache.delete(reportId), 0);
                return null; // return null if the fetch is empty
            }
            if (fetched.error) {
                promiseResolve(null);
                setTimeout(() => this.fetchingCache.delete(reportId), 0);
                throw new types_1.GenericAPIError(`${fetched.error}: ${fetched.message}`);
            }
            const parsed = fagc_api_types_1.Report.safeParse(fetched);
            if (!parsed.success || parsed.data === null) { // if the fetch is not successful, return null or throw an error with invalid data
                promiseResolve(null);
                setTimeout(() => this.fetchingCache.delete(reportId), 0);
                if (!parsed.success)
                    throw parsed.error;
                return null;
            }
            if (cache)
                this.add(parsed.data);
            promiseResolve(parsed.data);
            // remove the data from the fetching cache after 0ms (will run in the next event loop) as it can use the normal cache instead
            setTimeout(() => this.fetchingCache.delete(reportId), 0);
            return parsed.data;
        });
    }
    // Obsolete accessors
    search({ playername, categoryId, communityId, cache = true, }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ playername, categoryId, communityId, cache });
        });
    }
    fetchByCategory({ categoryId, cache = true }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ categoryId, cache });
        });
    }
    fetchAllName({ playername, cache = true }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ playername, cache });
        });
    }
    fetchByCommunity({ communityId, cache = true }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ communityId, cache });
        });
    }
    list({ playername, categoryIds, communityIds, cache = true }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ playername, categoryId: categoryIds, communityId: communityIds, cache });
        });
    }
    fetchSince({ timestamp, cache = true }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.fetchAll({ after: timestamp, cache });
        });
    }
}
exports.default = ReportManager;
//# sourceMappingURL=ReportManager.js.map