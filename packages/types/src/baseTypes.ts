import { z } from "zod"

export const Common = z.object({
	id: z.string(),
})
export type Common = z.infer<typeof Common>

// This exists so that creating a report doesn't need an ID and some stuff is optional
export const CreateReport = z.object({
	playername: z.string(),
	brokenRule: z.string(),
	proof: z.string().default("No proof"),
	description: z.string().default("No description"),
	automated: z.boolean().default(false),
	reportedTime: z.string().default(() => new Date().toISOString()).transform((x) => new Date(x)),
	adminId: z.string(),
})
export type CreateReport = z.infer<typeof CreateReport>

export const Report = z.object({
	communityId: z.string(),
}).merge(Common).merge(CreateReport)
export type Report = z.infer<typeof Report>

export interface Revocation extends Report {
	revokedTime: Date
	revokedBy: string
	reportId: ApiID
}

export interface Community extends Common {
	name: string
	contact: string
	guildIds: string[]
}

export interface Rule extends Common {
	shortdesc: string
	longdesc: string
}

export interface GuildConfig {
	guildId: string
	communityId?: string
	trustedCommunities: ApiID[]
	ruleFilters: ApiID[]
	roles: {
		reports: string
		webhooks: string
		setConfig: string
		setRules: string
		setCommunities: string
	}
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
