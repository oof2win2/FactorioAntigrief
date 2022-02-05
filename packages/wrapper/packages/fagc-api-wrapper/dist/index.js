"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAGCWrapper = void 0;
const tslib_1 = require("tslib");
const CommunityManager_1 = (0, tslib_1.__importDefault)(require("./managers/CommunityManager"));
const InfoManager_1 = (0, tslib_1.__importDefault)(require("./managers/InfoManager"));
const RevocationManager_1 = (0, tslib_1.__importDefault)(require("./managers/RevocationManager"));
const CategoryManager_1 = require("./managers/CategoryManager");
const ReportManager_1 = (0, tslib_1.__importDefault)(require("./managers/ReportManager"));
const WebsocketListener_1 = (0, tslib_1.__importDefault)(require("./WebsocketListener"));
// export types
(0, tslib_1.__exportStar)(require("./types/index"), exports);
class FAGCWrapper {
    constructor(baseOptions = {}, managerOptions = {
        uncacheage: 1000 * 60 * 15,
        uncachems: 1000 * 60 * 15,
    }) {
        this.apikey = null;
        this.masterapikey = null;
        const options = Object.assign({ apiurl: "https://factoriobans.club/api", socketurl: "https://factoriobans.club/api/ws" }, baseOptions);
        if (!options.apiurl)
            options.apiurl = "https://factoriobans.club/api";
        if (!options.socketurl)
            options.socketurl = "https://factoriobans.club/api/ws";
        this.apiurl = options.apiurl;
        if (options.apikey)
            this.apikey = options.apikey;
        if (options.masterapikey)
            this.masterapikey = options.masterapikey;
        this.revocations = new RevocationManager_1.default(options, managerOptions);
        this.communities = new CommunityManager_1.default(options, managerOptions);
        this.categories = new CategoryManager_1.CategoryManager(options, managerOptions);
        this.info = new InfoManager_1.default(options, managerOptions);
        this.reports = new ReportManager_1.default(options, managerOptions);
        this.websocket = new WebsocketListener_1.default({
            uri: options.socketurl || "wss://factoriobans.club/api/ws",
            enabled: options.enableWebSocket,
        });
    }
    destroy() {
        Object.keys(this).forEach((key) => {
            if (typeof this[key] == "object" &&
                this[key] !== null &&
                typeof this[key]["destroy"] == "function")
                this[key]["destroy"]();
        });
        this.apikey = null;
        this.masterapikey = null;
    }
    setdata({ apikey, masterapikey, url, socketurl, }) {
        if (apikey || apikey === null) {
            this.revocations.apikey = apikey;
            this.communities.apikey = apikey;
            this.categories.apikey = apikey;
            this.info.apikey = apikey;
            this.reports.apikey = apikey;
        }
        if (masterapikey || masterapikey === null) {
            this.revocations.masterapikey = masterapikey;
            this.communities.masterapikey = masterapikey;
            this.categories.masterapikey = masterapikey;
            this.info.masterapikey = masterapikey;
            this.reports.masterapikey = masterapikey;
        }
        if (url) {
            this.revocations.apiurl = url;
            this.communities.apiurl = url;
            this.categories.apiurl = url;
            this.info.apiurl = url;
            this.reports.apiurl = url;
        }
        if (socketurl)
            this.websocket.setUrl(socketurl);
    }
}
exports.FAGCWrapper = FAGCWrapper;
//# sourceMappingURL=index.js.map