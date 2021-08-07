export type ApiID = string

export interface Common {
	id: ApiID
	// here, there should be everything that keys can be
	[key: string]: string | boolean | Date | Report[]
}


// This exists so that creating a report doesn't need an ID and some stuff is optional
export interface CreateReport {
	playername: string
	brokenRule: ApiID
	proof?: string
	description?: string
	automated?: boolean
	reportedTime?: Date
	adminId: string
}
export interface Report extends Common, Required<CreateReport> {
	communityId: ApiID
}

export interface Revocation extends Report {
	revokedTime: Date
	revokedBy: string
	reportId: ApiID
}

export interface Profile {
	communityId: ApiID
	playername: string
	reports: Report[]
}

export interface Community extends Common {
	name: string
	contact: string
	guildId: string
}

export interface Rule extends Common {
	shortdesc: string
	longdesc: string
}

export interface CommunityConfig {
	trustedCommunities?: ApiID[]
	ruleFilters?: ApiID[]
	guildId: string
	contact: string,
	moderatorRoleId: string,
	communityname: string
}

// this also extends common but the ID is a Discord string
export interface Webhook extends Common {
	token: string
	guildId: string
}