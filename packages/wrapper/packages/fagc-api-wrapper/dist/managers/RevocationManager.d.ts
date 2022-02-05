import "cross-fetch/polyfill";
import { ManagerOptions, WrapperOptions } from "../types/types";
import { Revocation } from "fagc-api-types";
import BaseManager from "./BaseManager";
import { FetchRequestTypes } from "../types/privatetypes";
export default class RevocationManager extends BaseManager<Revocation> {
    constructor(options: WrapperOptions, managerOptions?: ManagerOptions);
    fetchAll({ playername, categoryId, adminId, after, cache, reqConfig }: {
        playername?: string | string[];
        categoryId?: string | string[];
        adminId?: string | string[];
        after?: Date;
    } & FetchRequestTypes): Promise<Revocation[]>;
    fetchRevocation({ revocationId, cache, reqConfig }: {
        revocationId: string;
    } & FetchRequestTypes): Promise<Revocation | null>;
    revoke({ reportId, adminId, cache, reqConfig, }: {
        reportId: string;
        adminId: string;
    } & FetchRequestTypes): Promise<Revocation>;
    revokeCategory({ categoryId, adminId, cache, reqConfig }: {
        categoryId: string;
        adminId: string;
    } & FetchRequestTypes): Promise<Revocation[]>;
    revokePlayer({ playername, adminId, cache, reqConfig }: {
        playername: string;
        adminId: string;
    } & FetchRequestTypes): Promise<Revocation[]>;
    fetchCategory({ categoryId, cache, reqConfig }: {
        categoryId: string;
    } & FetchRequestTypes): Promise<Revocation[]>;
    fetchPlayer({ playername, cache, reqConfig }: {
        playername: string;
    } & FetchRequestTypes): Promise<Revocation[]>;
    fetchSince({ timestamp, cache, reqConfig }: {
        timestamp: Date;
    } & FetchRequestTypes): Promise<Revocation[]>;
}
//# sourceMappingURL=RevocationManager.d.ts.map