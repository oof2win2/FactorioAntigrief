import { GuildConfigChangedMessage } from "fagc-api-types"

export interface RequestConfig {
	apikey?: string
	masterapikey?: string
	cookieAuth?: boolean
}
export interface ManagerOptions {
	uncachems?: number // at which time it should be uncached
	uncacheage?: number // age in ms of how old the stuff needs to be to be removed. defaults to 15 mins
}
export interface WrapperOptions {
	apiurl: string
	apikey?: string
	masterapikey?: string
	socketurl: string
	enableWebSocket?: boolean
}
export interface AddOptions {
	id?: never
}
export type ApiID = string
