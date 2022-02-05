import "cross-fetch/polyfill";
import { ManagerOptions, WrapperOptions } from "../types/types";
import { Webhook } from "fagc-api-types";
import BaseManager from "./BaseManager";
import { APIEmbed } from "discord-api-types";
import { FetchRequestTypes } from "../types/privatetypes";
export default class InfoManager extends BaseManager<Webhook> {
    constructor(options: WrapperOptions, managerOptions?: ManagerOptions);
    addWebhook({ webhookId, webhookToken }: {
        webhookId: string;
        webhookToken: string;
    }): Promise<Webhook>;
    removeWebhook({ webhookId, webhookToken }: {
        webhookId: string;
        webhookToken: string;
    }): Promise<Webhook | null>;
    messageGuild({ guildId, content, embeds, reqConfig, }: {
        guildId: string;
        content?: string;
        embeds?: APIEmbed[];
    } & FetchRequestTypes): Promise<void>;
    notifyGuildText({ guildId, text, reqConfig }: {
        guildId: string;
        text: string;
    } & FetchRequestTypes): Promise<void>;
    notifyGuildEmbed({ guildId, embed, reqConfig }: {
        guildId: string;
        embed: APIEmbed;
    } & FetchRequestTypes): Promise<void>;
}
//# sourceMappingURL=InfoManager.d.ts.map