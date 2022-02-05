import "cross-fetch/polyfill";
import { ManagerOptions, WrapperOptions } from "../types";
import { Report, CreateReport } from "fagc-api-types";
import BaseManager from "./BaseManager";
import { FetchRequestTypes } from "../types/privatetypes";
export default class ReportManager extends BaseManager<Report> {
    constructor(options: WrapperOptions, managerOptions?: ManagerOptions);
    fetchAll({ playername, communityId, categoryId, adminId, after, cache, }: {
        playername?: string | string[];
        communityId?: string | string[];
        categoryId?: string | string[];
        adminId?: string | string[];
        after?: Date;
    } & FetchRequestTypes): Promise<Report[]>;
    create({ report, cache, reqConfig }: {
        report: CreateReport;
    } & FetchRequestTypes): Promise<Report>;
    fetchReport({ reportId, cache, force }: {
        reportId: string;
    } & FetchRequestTypes): Promise<Report | null>;
    search({ playername, categoryId, communityId, cache, }: {
        playername?: string;
        categoryId?: string;
        communityId?: string;
    } & FetchRequestTypes): Promise<Report[]>;
    fetchByCategory({ categoryId, cache }: {
        categoryId: string;
    } & FetchRequestTypes): Promise<Report[]>;
    fetchAllName({ playername, cache }: {
        playername: string;
    } & FetchRequestTypes): Promise<Report[]>;
    fetchByCommunity({ communityId, cache }: {
        communityId: string;
    } & FetchRequestTypes): Promise<Report[]>;
    list({ playername, categoryIds, communityIds, cache }: {
        playername?: string;
        categoryIds: string[];
        communityIds: string[];
        cache?: boolean;
    }): Promise<Report[]>;
    fetchSince({ timestamp, cache }: {
        timestamp: Date;
    } & FetchRequestTypes): Promise<Report[]>;
}
//# sourceMappingURL=ReportManager.d.ts.map