import { RequestConfig } from ".";
import BaseManager from "./managers/BaseManager";
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 *
 * @throws AuthError if the API key is not set
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
export declare const authenticate: <X, T extends {
    id: string;
}>(manager: X & BaseManager<T>, reqConfig: RequestConfig) => string;
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it returns null.
 *
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
export declare const optionalAuthenticate: <X, T extends {
    id: string;
}>(manager: X & BaseManager<T>, reqConfig: RequestConfig) => string | null;
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 *
 * @throws AuthError if the API key is not set
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
export declare const masterAuthenticate: <X, T extends {
    id: string;
}>(manager: X & BaseManager<T>, reqConfig: RequestConfig) => string;
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 *
 * @throws AuthError if the API key is not set
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
export declare const optionalMasterAuthenticate: <X, T extends {
    id: string;
}>(manager: X & BaseManager<T>, reqConfig: RequestConfig) => string | null;
//# sourceMappingURL=utils.d.ts.map