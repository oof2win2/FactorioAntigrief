"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const isomorphic_ws_1 = (0, tslib_1.__importDefault)(require("isomorphic-ws"));
const reconnecting_websocket_1 = (0, tslib_1.__importDefault)(require("reconnecting-websocket"));
const fagc_api_types_1 = require("fagc-api-types");
class WebSocketHandler extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.opts = opts;
        this.guildIds = [];
        // don't create the websocket if it has not been enabled
        this.socketurl = this.opts.uri;
        this.socket = new reconnecting_websocket_1.default(() => this.socketurl, undefined, {
            WebSocket: isomorphic_ws_1.default,
            startClosed: true
        });
        if (this.opts.enabled)
            this.socket.reconnect();
        // handle socket messages
        this.socket.onmessage = (msg) => {
            try {
                const parsed = fagc_api_types_1.BaseWebsocketMessage.safeParse(JSON.parse(msg.data));
                if (parsed.success)
                    this.handleMessage(parsed.data);
            }
            catch (e) {
                console.error(e);
            }
        };
        this.socket.onerror = console.error;
        this.socket.onopen = () => {
            this.guildIds.map((id) => {
                this.socket.send(JSON.stringify({
                    type: "addGuildId",
                    guildId: id,
                }));
            });
        };
    }
    handleMessage(message) {
        const messageType = message.messageType;
        switch (messageType) {
            case "guildConfigChanged": {
                const parsed = fagc_api_types_1.GuildConfigChangedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("guildConfigChanged", parsed.data);
                break;
            }
            case "report": {
                const parsed = fagc_api_types_1.ReportCreatedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("report", parsed.data);
                break;
            }
            case "revocation": {
                const parsed = fagc_api_types_1.RevocationMessage.safeParse(message);
                if (parsed.success)
                    this.emit("revocation", parsed.data);
                break;
            }
            case "categoryCreated": {
                const parsed = fagc_api_types_1.CategoryCreatedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("categoryCreated", parsed.data);
                break;
            }
            case "categoryUpdated": {
                const parsed = fagc_api_types_1.CategoryUpdatedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("categoryUpdated", parsed.data);
                break;
            }
            case "categoryRemoved": {
                const parsed = fagc_api_types_1.CategoryRemovedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("categoryRemoved", parsed.data);
                break;
            }
            case "categoriesMerged": {
                const parsed = fagc_api_types_1.CategoriesMergedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("categoriesMerged", parsed.data);
                break;
            }
            case "communityCreated": {
                const parsed = fagc_api_types_1.CommunityCreatedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("communityCreated", parsed.data);
                break;
            }
            case "communityRemoved": {
                const parsed = fagc_api_types_1.CommunityRemovedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("communityRemoved", parsed.data);
                break;
            }
            case "communityUpdated": {
                const parsed = fagc_api_types_1.CommunityUpdatedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("communityUpdated", parsed.data);
                break;
            }
            case "communitiesMerged": {
                const parsed = fagc_api_types_1.CommunitiesMergedMessage.safeParse(message);
                if (parsed.success)
                    this.emit("communitiesMerged", parsed.data);
                break;
            }
        }
    }
    addGuildId(guildId) {
        var _a;
        if (this.guildIds.includes(guildId))
            return; // don't do anything if it already is set
        // save guild id to list
        this.guildIds.push(guildId);
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
            type: "addGuildId",
            guildId: guildId,
        }));
    }
    removeGuildId(guildId) {
        var _a;
        if (!this.guildIds.includes(guildId))
            return; // don't do anything if it isn't there
        // remove the id from local list & then send info to backend
        this.guildIds = this.guildIds.filter(id => id !== guildId);
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
            type: "removeGuildId",
            guildId: guildId,
        }));
    }
    close() {
        this.socket.close();
    }
    open() {
        this.socket.reconnect();
    }
    setUrl(url) {
        this.socket.close();
        this.socketurl = url;
        this.socket.reconnect();
    }
    destroy() {
        this.socket.close();
    }
}
exports.default = WebSocketHandler;
//# sourceMappingURL=WebsocketListener.js.map