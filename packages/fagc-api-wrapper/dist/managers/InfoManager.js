"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("cross-fetch/polyfill");
const fagc_api_types_1 = require("fagc-api-types");
const BaseManager_1 = (0, tslib_1.__importDefault)(require("./BaseManager"));
const types_1 = require("../types");
const strict_uri_encode_1 = (0, tslib_1.__importDefault)(require("strict-uri-encode"));
const utils_1 = require("../utils");
class InfoManager extends BaseManager_1.default {
    constructor(options, managerOptions = {}) {
        super(managerOptions);
        if (options.apikey)
            this.apikey = options.apikey;
        if (options.masterapikey)
            this.masterapikey = options.masterapikey;
        this.apiurl = options.apiurl;
    }
    addWebhook({ webhookId, webhookToken }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const webhookPath = `${(0, strict_uri_encode_1.default)(webhookId)}/${(0, strict_uri_encode_1.default)(webhookToken)}`;
            const add = yield fetch(`${this.apiurl}/discord/webhook/${webhookPath}`, {
                method: "PUT",
                credentials: "include",
            }).then((w) => w.json());
            if (add.error)
                throw new types_1.GenericAPIError(`${add.error}: ${add.message}`);
            return fagc_api_types_1.Webhook.parse(add);
        });
    }
    removeWebhook({ webhookId, webhookToken }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const webhookPath = `${(0, strict_uri_encode_1.default)(webhookId)}/${(0, strict_uri_encode_1.default)(webhookToken)}`;
            const add = yield fetch(`${this.apiurl}/discord/webhook/${webhookPath}`, {
                method: "DELETE",
                credentials: "include",
            }).then((w) => w.json());
            return fagc_api_types_1.Webhook.nullable().parse(add);
        });
    }
    messageGuild({ guildId, content, embeds, reqConfig = {}, }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            yield fetch(`${this.apiurl}/discord/guilds/${(0, strict_uri_encode_1.default)(guildId)}/message`, {
                method: "POST",
                body: JSON.stringify({
                    content: content,
                    embeds: embeds,
                }),
                credentials: "include",
                headers: {
                    authorization: (0, utils_1.masterAuthenticate)(this, reqConfig),
                    "content-type": "application/json",
                },
            });
        });
    }
    notifyGuildText({ guildId, text, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.messageGuild({ guildId, content: text, reqConfig });
        });
    }
    notifyGuildEmbed({ guildId, embed, reqConfig = {} }) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            return yield this.messageGuild({ guildId, embeds: [embed], reqConfig });
        });
    }
}
exports.default = InfoManager;
//# sourceMappingURL=InfoManager.js.map