import { APIEmbed, APIUser } from "discord-api-types"
import { z } from "zod"
import {
	Category,
	Community,
	FilterObject,
	GuildConfig,
	Report,
	Revocation,
} from "./baseTypes"

export const BaseWebsocketMessage = z.object({
	messageType: z.enum([
		"report",
		"revocation",
		"categoryCreated",
		"categoryRemoved",
		"categoryUpdated",
		"categoriesMerged",
		"communityCreated",
		"communityRemoved",
		"communityUpdated",
		"communitiesMerged",
		"guildConfigChanged",
		"announcement",
		"filterObjectChanged",
	]),
})
export type BaseWebsocketMessage = z.infer<typeof BaseWebsocketMessage>

export const ReportMessageExtraOpts = z.object({
	community: Community,
	createdBy: z.object({}).passthrough(), // no way to validate this
	category: Category,
	totalReports: z.number(),
	totalCommunities: z.number(),
})
export type ReportMessageExtraOpts = z.infer<typeof ReportMessageExtraOpts> & {
	createdBy: APIUser
}

export const ReportCreatedMessage = z
	.object({
		messageType: z.literal("report"),
		embed: z.object({}).passthrough(), // no way to validate this
		report: Report,
		extra: ReportMessageExtraOpts,
	})
	.merge(BaseWebsocketMessage)
export type ReportCreatedMessage = z.infer<typeof ReportCreatedMessage> & {
	embed: APIEmbed
}

export const RevocationMessageExtraOpts = z
	.object({
		revokedBy: z.object({}).passthrough(), // no way to validate this
	})
	.merge(ReportMessageExtraOpts)
	.omit({ createdBy: true })
export type RevocationMessageExtraOpts = z.infer<
	typeof RevocationMessageExtraOpts
> & { revokedBy: APIUser }

export const RevocationMessage = z
	.object({
		messageType: z.literal("revocation"),
		embed: z.object({}).passthrough(), // no way to validate this
		revocation: Revocation,
		extra: RevocationMessageExtraOpts,
	})
	.merge(BaseWebsocketMessage)
export type RevocationMessage = z.infer<typeof RevocationMessage> & {
	embed: APIEmbed
}

export const CategoryCreatedMessage = z
	.object({
		messageType: z.literal("categoryCreated"),
		embed: z.object({}).passthrough(), // no way to validate this
		category: Category,
	})
	.merge(BaseWebsocketMessage)
export type CategoryCreatedMessage = z.infer<typeof CategoryCreatedMessage> & {
	embed: APIEmbed
}

export const CategoryRemovedMessage = z
	.object({
		messageType: z.literal("categoryRemoved"),
		embed: z.object({}).passthrough(), // no way to validate this
		category: Category,
	})
	.merge(BaseWebsocketMessage)
export type CategoryRemovedMessage = z.infer<typeof CategoryRemovedMessage> & {
	embed: APIEmbed
}

export const CategoryUpdatedMessage = z
	.object({
		messageType: z.literal("categoryUpdated"),
		embed: z.object({}).passthrough(), // no way to validate this
		category: Category,
	})
	.merge(BaseWebsocketMessage)
export type CategoryUpdatedMessage = z.infer<typeof CategoryUpdatedMessage> & {
	embed: APIEmbed
}

export const CategoriesMergedMessage = z
	.object({
		messageType: z.literal("categoriesMerged"),
		embed: z.object({}).passthrough(), // no way to validate this
		categories: Category,
	})
	.merge(BaseWebsocketMessage)
export type CategoriesMergedMessage = z.infer<
	typeof CategoriesMergedMessage
> & { embed: APIEmbed }

export const CommunityCreatedMessageExtraOpts = z.object({
	createdBy: z.object({}).passthrough(), // no way to validate this
})
export type CommunityCreatedMessageExtraOpts = z.infer<
	typeof CommunityCreatedMessageExtraOpts
> & { createdBy: APIUser }

export const CommunityCreatedMessage = z
	.object({
		messageType: z.literal("communityCreated"),
		embed: z.object({}).passthrough(), // no way to validate this
		community: Community,
		extraData: CommunityCreatedMessageExtraOpts,
	})
	.merge(BaseWebsocketMessage)
export type CommunityCreatedMessage = z.infer<
	typeof CommunityCreatedMessage
> & { embed: APIEmbed }

export const CommunityRemovedMessage = z
	.object({
		messageType: z.literal("communityRemoved"),
		embed: z.object({}).passthrough(), // no way to validate this
		community: Community,
		extraData: CommunityCreatedMessageExtraOpts,
	})
	.merge(BaseWebsocketMessage)
export type CommunityRemovedMessage = z.infer<
	typeof CommunityRemovedMessage
> & { embed: APIEmbed }

export const CommunityUpdatedMessage = z
	.object({
		messageType: z.literal("communityRemoved"),
		embed: z.object({}).passthrough(), // no way to validate this
		community: Community,
		extraData: CommunityCreatedMessageExtraOpts,
	})
	.merge(BaseWebsocketMessage)
export type CommunityUpdatedMessage = z.infer<
	typeof CommunityUpdatedMessage
> & { embed: APIEmbed }

export const CommunitiesMergedMessage = z
	.object({
		messageType: z.literal("communitiesMerged"),
		embed: z.object({}).passthrough(), // no way to validate this
		receiving: Community,
		dissolving: Community,
		extraData: CommunityCreatedMessageExtraOpts,
	})
	.merge(BaseWebsocketMessage)
export type CommunitiesMergedMessage = z.infer<
	typeof CommunitiesMergedMessage
> & { embed: APIEmbed }

export const GuildConfigChangedMessage = z
	.object({
		messageType: z.literal("guildConfigChanged"),
		config: GuildConfig,
	})
	.merge(BaseWebsocketMessage)
export type GuildConfigChangedMessage = z.infer<
	typeof GuildConfigChangedMessage
>

export const FilterObjectChangedMessage = z
	.object({
		messageType: z.literal("filterObjectChanged"),
		filterObject: FilterObject,
	})
	.merge(BaseWebsocketMessage)
export type FilterObjectChangedMessage = z.infer<
	typeof FilterObjectChangedMessage
>

export const AnnouncementMessage = z.object({
	messageType: z.literal("announcement"),
	embed: z.object({}).passthrough(), // no way to validate this
})
export type AnnouncementMessage = z.infer<typeof AnnouncementMessage> & {
	embed: APIEmbed
}
