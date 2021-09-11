import { APIEmbed, APIUser } from "discord-api-types";
import { Community, CommunityConfig, Report, Revocation, Rule } from "./baseTypes";

export interface BaseWebsocketMessage {
	messageType: string
}

export interface ReportMessageExtraOpts {
	community: Community,
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
	rule: Rule,
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

export interface CommunityRemovedMessageExtraOpts {
	contact: APIUser
}
export interface CommunityRemovedMessage extends BaseWebsocketMessage {
	messageType: "communityRemoved"
	embed: APIEmbed
	community: Community
	extraData: CommunityRemovedMessageExtraOpts
}

export interface GuildConfigChangedMessage extends BaseWebsocketMessage {
	messageType: "communityConfigChanged"
	config: CommunityConfig
}

export interface AnnouncementMessage extends BaseWebsocketMessage {
	messageType: "announcement"
	embed: APIEmbed
}