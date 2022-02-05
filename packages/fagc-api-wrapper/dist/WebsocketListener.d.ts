/// <reference types="node" />
import { EventEmitter } from "events";
import { CommunityCreatedMessage, ReportCreatedMessage, RevocationMessage, CategoryCreatedMessage, CategoryRemovedMessage, CommunityRemovedMessage, CommunityUpdatedMessage, CommunitiesMergedMessage, CategoryUpdatedMessage, CategoriesMergedMessage, GuildConfigChangedMessage, BaseWebsocketMessage } from "fagc-api-types";
export interface WebSockethandlerOpts {
    uri: string;
    enabled?: boolean;
}
export declare type WebSocketMessageType = "guildConfigChanged" | "report" | "revocation" | "categoryCreated" | "categoryRemoved" | "categoryUpdated" | "categoriesMerged" | "communityCreated" | "communityRemoved" | "communityUpdated" | "communitiesMerged" | "announcement" | "reconnecting" | "connected";
/**
 * @deprecated Use BaseWebsocketMessage instead
 */
export declare type WebSocketMessage = BaseWebsocketMessage;
export declare interface WebSocketEvents {
    guildConfigChanged: (message: GuildConfigChangedMessage) => void;
    report: (message: ReportCreatedMessage) => void;
    revocation: (message: RevocationMessage) => void;
    categoryCreated: (message: CategoryCreatedMessage) => void;
    categoryRemoved: (message: CategoryRemovedMessage) => void;
    categoryUpdated: (message: CategoryUpdatedMessage) => void;
    categoriesMerged: (message: CategoriesMergedMessage) => void;
    communityCreated: (message: CommunityCreatedMessage) => void;
    communityRemoved: (message: CommunityRemovedMessage) => void;
    communityUpdated: (message: CommunityUpdatedMessage) => void;
    communitiesMerged: (message: CommunitiesMergedMessage) => void;
    reconnecting: (message: void) => void;
    connected: (message: void) => void;
}
declare interface WebSocketHandler {
    on<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this;
    off<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this;
    once<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this;
    emit<E extends keyof WebSocketEvents>(event: E, ...args: Parameters<WebSocketEvents[E]>): boolean;
}
declare class WebSocketHandler extends EventEmitter {
    private socket;
    private opts;
    private guildIds;
    private socketurl;
    constructor(opts: WebSockethandlerOpts);
    handleMessage(message: BaseWebsocketMessage): void;
    addGuildId(guildId: string): void;
    removeGuildId(guildId: string): void;
    close(): void;
    open(): void;
    setUrl(url: string): void;
    destroy(): void;
}
export default WebSocketHandler;
//# sourceMappingURL=WebsocketListener.d.ts.map