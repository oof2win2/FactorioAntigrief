import { z } from "zod"

export const Common = z.object({
	id: z.string(),
})
export type Common = z.infer<typeof Common>

// date types, used privately here
const DateType = z.union([ z.string().transform((x) => new Date(x)), z.date() ])
const DateTypeDefault = z.union([ z.string().default(() => new Date().toISOString()).transform((x) => new Date(x)), z.date() ])

// This exists so that creating a report doesn't need an ID and some stuff is optional
export const CreateReport = z.object({
	playername: z.string(),
	brokenRule: z.string(),
	proof: z.string().default("No proof"),
	description: z.string().default("No description"),
	automated: z.boolean().default(false),
	reportedTime: DateTypeDefault,
	adminId: z.string(),
})
export type CreateReport = z.infer<typeof CreateReport>

export const Report = z.object({
	communityId: z.string(),
	reportCreatedAt: DateType,
}).merge(Common).merge(CreateReport.required())
export type Report = z.infer<typeof Report>

export const Revocation = z.object({
	revokedAt: DateType,
	revokedBy: z.string(),
}).merge(Report)
export type Revocation = z.infer<typeof Revocation>

export const Community = z.object({
	name: z.string(),
	contact: z.string(),
	guildIds: z.array(z.string()),
	tokenInvalidBefore: DateType,
}).merge(Common)
export type Community = z.infer<typeof Community>

export const Rule = z.object({
	shortdesc: z.string(),
	longdesc: z.string(),
}).merge(Common)
export type Rule = z.infer<typeof Rule>

export const GuildConfig = z.object({
	guildId: z.string(),
	communityId: z.string().optional(),
	trustedCommunities: z.array(z.string()).default([]),
	ruleFilters: z.array(z.string()).default([]),
	roles: z.object({
		reports: z.string().default(""),
		webhooks: z.string().default(""),
		setConfig: z.string().default(""),
		setRules: z.string().default(""),
		setCommunities: z.string().default(""),
	})
})
export type GuildConfig = z.infer<typeof GuildConfig>

// this also extends common but the ID is a Discord string
export const Webhook = z.object({
	token: z.string(),
	guildId: z.string(),
}).merge(Common)
export type Webhook = z.infer<typeof Webhook>