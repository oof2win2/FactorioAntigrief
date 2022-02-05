export interface RequestConfig {
    /**
     * FAGC API key
     */
    apikey?: string;
    /**
     * FAGC API Master key
     */
    masterapikey?: string;
}
export interface ManagerOptions {
    uncachems?: number;
    uncacheage?: number;
}
export interface BaseWrapperOptions {
    apiurl?: string;
    apikey?: string;
    masterapikey?: string;
    socketurl?: string;
    enableWebSocket?: boolean;
}
export interface WrapperOptions extends BaseWrapperOptions {
    apiurl: string;
    socketurl: string;
}
export interface AddOptions {
    id?: never;
}
export declare type ApiId = string;
//# sourceMappingURL=types.d.ts.map