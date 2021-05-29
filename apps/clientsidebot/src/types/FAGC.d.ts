import { Snowflake } from "discord.js";

export interface FAGCConfig {
	guildid: Snowflake,
	apikey: string,
	contact: Snowflake,
	moderatorroleId: Snowflake,
	communityname: string,
	roles: {
		setCommunities?: Snowflake,
		setConfig?: Snowflake,
		setRules?: Snowflake,
		violations?: Snowflake,
		webhooks?: Snowflake,
	}
	trustedCommunities: string[],
	ruleFilters: string[]
}
export interface FAGCMessage {
	messageType: string,

}