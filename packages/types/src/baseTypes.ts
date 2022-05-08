import { z } from "zod"

export const Common = z.object({
	id: z.string(),
})
export type Common = z.infer<typeof Common>

// date types, used privately here
const DateType = z.union([z.string().transform((x) => new Date(x)), z.date()])
const DateTypeDefault = z.union([
	z
		.string()
		.default(() => new Date().toISOString())
		.transform((x) => new Date(x)),
	z.date(),
])

// This exists so that creating a report doesn't need an ID and some stuff is optional
export const CreateReport = z.object({
	playername: z.string(),
	categoryId: z.string(),
	proof: z.string().default("No proof"),
	description: z.string().default("No description"),
	automated: z.boolean().default(false),
	reportedTime: DateTypeDefault,
	adminId: z.string(),
})
export type CreateReport = z.infer<typeof CreateReport>

export const Report = z
	.object({
		communityId: z.string(),
		reportCreatedAt: DateType,
	})
	.merge(Common)
	.merge(CreateReport.required())
export type Report = z.infer<typeof Report>

export const Revocation = z
	.object({
		revokedAt: DateType,
		revokedBy: z.string(),
	})
	.merge(Report)
export type Revocation = z.infer<typeof Revocation>

export const Community = z
	.object({
		name: z.string(),
		contact: z.string(),
		guildIds: z.array(z.string()),
		tokenInvalidBefore: DateType,
		filterObjectId: z.string(),
	})
	.merge(Common)
export type Community = z.infer<typeof Community>

export const Category = z
	.object({
		name: z.string(),
		description: z.string(),
	})
	.merge(Common)
export type Category = z.infer<typeof Category>

export const SetGuildConfing = z.object({
	guildId: z.string(),
	communityId: z.string().optional(),
	filterObjectId: z.string().optional(),
	roles: z
		.object({
			reports: z.string().default(""),
			webhooks: z.string().default(""),
			setConfig: z.string().default(""),
			setCategories: z.string().default(""),
			setCommunities: z.string().default(""),
		})
		.optional(),
	apikey: z.string().nullable().optional(),
})
export const GuildConfig = SetGuildConfing.required().merge(
	SetGuildConfing.pick({
		communityId: true,
		apikey: true,
	})
)

export type SetGuildConfig = z.infer<typeof SetGuildConfing>
export type GuildConfig = z.infer<typeof GuildConfig>

export const SetFilterObject = z.object({
	id: z.string(),
	categoryFilters: z.array(z.string()).optional(),
	communityFilters: z.array(z.string()).optional(),
})
export const FilterObject = SetFilterObject.required()

export type SetFilterObject = z.infer<typeof SetFilterObject>
export type FilterObject = z.infer<typeof FilterObject>

// this also extends common but the ID is a Discord string
export const Webhook = z
	.object({
		token: z.string(),
		guildId: z.string(),
	})
	.merge(Common)
export type Webhook = z.infer<typeof Webhook>
