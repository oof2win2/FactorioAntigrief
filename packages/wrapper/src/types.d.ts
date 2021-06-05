import { Snowflake } from "discord-api-types"

export type ApiID = string

export interface Community {
	id: ApiID
	name: string
	contact: Snowflake
	guildid: Snowflake
}