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
	contact: string
	moderatorRoleId: string
	communityname: string
	communityId?: string
}

// this also extends common but the ID is a Discord string
export interface Webhook extends Common {
	token: string
	guildId: string
}

export interface User {
	discordUserId: string
	discordUserTag: string
	/**
	 * IDs of guilds where the user is has API access
	 */
	discordGuildIds: string[]
	apiAccess: {
		/**
		 * ID of the community this access is in
		 */
		communityId: string
		/**
		 * ID of the user
		 */
		discordUserId: string
		/**
		 * ID of the guild that this is in
		 */
		discordGuildId: string
		/**
		 * Whether the user has access to create and remove reports
		 */
		reports: boolean
		/**
		 * Whether the user has access to modify the community's config
		 */
		config: boolean
		/**
		 * Whether the user has access to change the community's notification settings
		 */
		notifications: boolean
	}[]
	/**
	 * IDs of communities where the user is an owner
	 */
	communityOwner: string[]
}
