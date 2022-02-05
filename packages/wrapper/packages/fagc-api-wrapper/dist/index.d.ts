import CommunityManager from "./managers/CommunityManager";
import InfoManager from "./managers/InfoManager";
import RevocationManager from "./managers/RevocationManager";
import { CategoryManager } from "./managers/CategoryManager";
import { ManagerOptions, BaseWrapperOptions } from "./types/types";
import ReportManager from "./managers/ReportManager";
import WebSocketHandler from "./WebsocketListener";
export * from "./types/index";
export declare class FAGCWrapper {
    readonly apiurl: string;
    apikey?: string | null;
    masterapikey?: string | null;
    communities: CommunityManager;
    categories: CategoryManager;
    reports: ReportManager;
    revocations: RevocationManager;
    info: InfoManager;
    websocket: WebSocketHandler;
    constructor(baseOptions?: BaseWrapperOptions, managerOptions?: ManagerOptions);
    destroy(): void;
    setdata({ apikey, masterapikey, url, socketurl, }: {
        apikey?: string | null;
        masterapikey?: string | null;
        url?: string;
        socketurl?: string;
    }): void;
}
//# sourceMappingURL=index.d.ts.map