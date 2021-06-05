import { ApiID } from "./apitypes"

export interface CommunityConfig {
	trustedCommunities?: ApiID[]
	ruleFilters?: ApiID[]
	guildid: string
	contact: string,
	moderatorroleId: string,
	communityname: string
}
export interface SetCommunityConfig {
	trustedCommunities?: ApiID[]
	ruleFilters?: ApiID[]
	guildid?: string
	contact?: string,
	moderatorroleId?: string,
	communityname?: string
}
export interface RequestConfig {
	apikey?: string
}