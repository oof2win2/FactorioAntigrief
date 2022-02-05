import "cross-fetch/polyfill";
import { Category } from "fagc-api-types";
import BaseManager from "./BaseManager";
import { ManagerOptions, WrapperOptions } from "../types";
import { FetchRequestTypes } from "../types/privatetypes";
export declare class CategoryManager extends BaseManager<Category> {
    constructor(options: WrapperOptions, managerOptions?: ManagerOptions);
    fetchAll({ cache }: FetchRequestTypes): Promise<Category[]>;
    create({ category, cache, reqConfig, }: {
        category: Omit<Category, "id">;
    } & FetchRequestTypes): Promise<Category>;
    fetchCategory({ categoryId, cache, force }: {
        categoryId: string;
    } & FetchRequestTypes): Promise<Category | null>;
    modify({ categoryId, name, description, reqConfig }: {
        categoryId: string;
        name?: string;
        description?: string;
    } & FetchRequestTypes): Promise<Category | null>;
    remove({ categoryId, reqConfig }: {
        categoryId: string;
    } & FetchRequestTypes): Promise<Category | null>;
    merge({ idReceiving, idDissolving, reqConfig }: {
        idReceiving: string;
        idDissolving: string;
    } & FetchRequestTypes): Promise<Category>;
}
//# sourceMappingURL=CategoryManager.d.ts.map