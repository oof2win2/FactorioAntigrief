import Collection from "@discordjs/collection";
import { Common } from "fagc-api-types";
import { AddOptions, ManagerOptions } from "../types/types";
export default class BaseManager<HoldsWithId extends Common> {
    apiurl: string;
    cache: Collection<Common["id"], HoldsWithId>;
    protected fetchingCache: Collection<Common["id"], Promise<HoldsWithId | null>>;
    private sweepCache;
    private interval;
    apikey?: string | null;
    masterapikey: string | null;
    constructor(options?: ManagerOptions);
    protected add(data: HoldsWithId, cache?: boolean, { id }?: AddOptions): HoldsWithId | null;
    protected removeFromCache(data: Pick<HoldsWithId, "id">): Pick<HoldsWithId, "id"> | null;
    clearCache(): void;
    resolveId(id: Common["id"]): HoldsWithId | null;
    destroy(): void;
}
//# sourceMappingURL=BaseManager.d.ts.map