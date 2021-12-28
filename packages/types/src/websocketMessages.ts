import { APIEmbed, APIUser } from "discord-api-types"
import { Community, GuildConfig, Report, Revocation, Rule } from "./baseTypes"

export interface BaseWebsocketMessage {
	messageType: string
}

export interface ReportMessageExtraOpts {
	community: Community
	admin: APIUser
	rule: Rule
	totalReports: number
	totalCommunities: number
}

export interface ReportCreatedMessage extends BaseWebsocketMessage {
	messageType: "report"
	embed: APIEmbed
	report: Report
	extraData: ReportMessageExtraOpts
}

export interface RevocationMessageExtraOpts extends ReportMessageExtraOpts {
	revokedBy: APIUser
}

export interface RevocationMessage extends BaseWebsocketMessage {
	messageType: "revocation"
	embed: APIEmbed
	revocation: Revocation
	extraData: RevocationMessageExtraOpts
}

export interface RuleCreatedMessage extends BaseWebsocketMessage {
	messageType: "ruleCreated"
	embed: APIEmbed
	rule: Rule
}

export interface RuleRemovedMessage extends BaseWebsocketMessage {
	messageType: "ruleRemoved"
	embed: APIEmbed
	rule: Rule
}

export interface RuleUpdatedMessage extends BaseWebsocketMessage {
	messageType: "ruleUpdated"
	embed: APIEmbed
	receiving: Rule
	dissolving: Rule
}

export interface RulesMergedMessage extends BaseWebsocketMessage {
	messageType: "rulesMerged"
	embed: APIEmbed
	rule: Rule
}

export interface CommunityCreatedMessageExtraOpts {
	contact: APIUser
}
export interface CommunityCreatedMessage extends BaseWebsocketMessage {
	messageType: "communityCreated"
	embed: APIEmbed
	community: Community
	extraData: CommunityCreatedMessageExtraOpts
}

export interface CommunityCreatedMessageExtraOpts {
	contact: APIUser
}
export interface CommunityRemovedMessage extends BaseWebsocketMessage {
	messageType: "communityRemoved"
	embed: APIEmbed
	community: Community
	extraData: CommunityCreatedMessageExtraOpts
}
export interface CommunityUpdatedMessage extends BaseWebsocketMessage {
	messageType: "communityRemoved"
	embed: APIEmbed
	community: Community
	extraData: CommunityCreatedMessageExtraOpts
}

export interface CommunitiesMergedMessage extends BaseWebsocketMessage {
	messageType: "communitiesMerged"
	embed: APIEmbed
	receiving: Community
	dissolving: Community
	extraData: CommunityCreatedMessageExtraOpts
}

export interface GuildConfigChangedMessage extends BaseWebsocketMessage {
	messageType: "guildConfigChanged"
	config: GuildConfig
}

export interface AnnouncementMessage extends BaseWebsocketMessage {
	messageType: "announcement"
	embed: APIEmbed
}
