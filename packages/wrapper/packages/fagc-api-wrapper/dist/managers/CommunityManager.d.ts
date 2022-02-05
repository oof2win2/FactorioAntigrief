import "cross-fetch/polyfill";
import { ManagerOptions, WrapperOptions } from "../types";
import BaseManager from "./BaseManager";
import { Community, GuildConfig } from "fagc-api-types";
import { FetchRequestTypes } from "../types/privatetypes";
declare type SetGuildConfig = Partial<GuildConfig> & Pick<GuildConfig, "guildId">;
declare type SetCommunityConfig = Partial<Omit<Community, "id" | "guildIds">>;
export default class CommunityManager extends BaseManager<Community> {
    constructor(options: WrapperOptions, managerOptions?: ManagerOptions);
    fetchAll({ cache }: FetchRequestTypes): Promise<Community[]>;
    setCommunityConfig({ config, cache, reqConfig }: {
        config: SetCommunityConfig;
    } & FetchRequestTypes): Promise<Community>;
    getCommunityConfig({ communityId, cache, reqConfig }: {
        communityId: string;
    } & FetchRequestTypes): Promise<Community | null>;
    fetchCommunity({ communityId, cache, force }: {
        communityId: string;
    } & FetchRequestTypes): Promise<Community | null>;
    fetchOwnCommunity({ cache, reqConfig }: FetchRequestTypes): Promise<Community | null>;
    setGuildConfig({ config, reqConfig }: {
        config: SetGuildConfig;
    } & FetchRequestTypes): Promise<GuildConfig>;
    setGuildConfigMaster({ config, reqConfig }: {
        config: SetGuildConfig;
    } & FetchRequestTypes): Promise<GuildConfig>;
    fetchGuildConfig({ guildId, }: {
        guildId: string;
    } & FetchRequestTypes): Promise<GuildConfig | null>;
    fetchGuildConfigMaster({ guildId, reqConfig }: {
        guildId: string;
    } & FetchRequestTypes): Promise<GuildConfig | null>;
    /**
     * Manage API key for your community
     */
    manageApikey({ create, invalidate, reqConfig, }: {
        create?: boolean;
        invalidate?: boolean;
    } & FetchRequestTypes): Promise<{
        apikey?: string;
    }>;
    /**
     * Create a new API key for your community
     */
    createApikey({ reqConfig }: FetchRequestTypes): Promise<string>;
    /**
     * Revoke all currently valid API keys created
     * @returns New API key to use
     */
    revokeApikeys({ reqConfig }: FetchRequestTypes): Promise<string>;
    /**
     * Manage an API key for a community with the use of the master API
     */
    masterManageApikey({ communityId, create, keyType, invalidate, reqConfig }: {
        communityId: string;
        create?: boolean;
        keyType?: "master" | "private";
        invalidate?: boolean;
    } & FetchRequestTypes): Promise<{
        apikey?: string;
    }>;
    /**
     * Create an API key for a community with the use of the master API
     */
    masterCreateKey({ communityId, keyType, reqConfig }: {
        communityId: string;
        keyType: "master" | "private";
    } & FetchRequestTypes): Promise<string>;
    /**
     * Revoke all currently valid API keys created for community
     * @returns New API key to use
     */
    masterRevokeKeys({ communityId, reqConfig }: {
        communityId: string;
    } & FetchRequestTypes): Promise<string>;
    create({ name, contact, cache, reqConfig }: {
        name: string;
        contact: string;
    } & FetchRequestTypes): Promise<{
        community: Community;
        apikey: string;
    }>;
    createGuildConfig({ guildId, reqConfig }: {
        guildId: string;
    } & FetchRequestTypes): Promise<GuildConfig>;
    notifyGuildConfigChanged({ guildId, reqConfig }: {
        guildId: string;
    } & FetchRequestTypes): Promise<void>;
    guildLeave({ guildId, reqConfig }: {
        guildId: string;
    } & FetchRequestTypes): Promise<void>;
    remove({ communityId, reqConfig }: {
        communityId: string;
    } & FetchRequestTypes): Promise<boolean>;
    merge({ idReceiving, idDissolving, reqConfig }: {
        idReceiving: string;
        idDissolving: string;
    } & FetchRequestTypes): Promise<Community>;
}
export {};
//# sourceMappingURL=CommunityManager.d.ts.map