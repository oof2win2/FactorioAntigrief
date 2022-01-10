export interface RequestConfig {
	/**
	 * FAGC API key
	 */
	apikey?: string
	/**
	 * FAGC API Master key
	 */
	masterapikey?: string
	/**
	 * Whether or not you are using cookie authentication
	 */
	cookieAuth?: boolean
	/**
	 * This is privately set by the library, any value input here will be overridden.
	 * 
	 * Used so the string is set only in one place and can be easily changed in the future.
	 */
	_keystring?: string
}
export interface ManagerOptions {
	uncachems?: number // at which time it should be uncached
	uncacheage?: number // age in ms of how old the stuff needs to be to be removed. defaults to 15 mins
}

export interface BaseWrapperOptions {
	apiurl?: string
	apikey?: string
	masterapikey?: string
	socketurl?: string
	enableWebSocket?: boolean
}

export interface WrapperOptions extends BaseWrapperOptions {
	apiurl: string
	socketurl: string
}
export interface AddOptions {
	id?: never
}
export type ApiID = string
