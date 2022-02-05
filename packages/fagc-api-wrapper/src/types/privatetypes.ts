import { RequestConfig } from "."

export interface FetchRequestTypes {
	reqConfig?: RequestConfig
	force?: boolean
	cache?: boolean
}