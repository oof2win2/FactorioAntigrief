import { Snowflake } from "discord.js"

export interface FAGCConfig {
	guildId: Snowflake,
	apikey: string,
	contact: Snowflake,
	moderatorRoleId: Snowflake,
	communityname: string,
	trustedCommunities?: string[],
	ruleFilters?: string[]
}
export interface FAGCMessage {
	messageType: string,
}