import { Snowflake } from "discord-api-types"

export type ApiID = string

export interface Community {
	id: ApiID
	name: string
	contact: Snowflake
	guildid: Snowflake
}
export interface Rule {
	id: ApiID
	shortdesc: string
	longdesc: string
}
export interface Violation {
	id: ApiID
	playername: String
	communityid: ApiID
	broken_rule: ApiID
	proof: string
	description: string
	automated: boolean
	violated_time: Date
	admin_id: string
}