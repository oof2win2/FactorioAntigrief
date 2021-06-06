export interface RequestConfig {
	apikey?: string
}
export interface ManagerOptions {
	uncachems?: number // at which time it should be uncached
	uncacheage?: number // age in ms of how old the stuff needs to be to be removed. defaults to 60 mins
}
export interface AddOptions {
	id?: never
}