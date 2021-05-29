import { Snowflake } from "discord.js";

export interface FactorioServer {
	name: string,
	discordname: string,
	discordid: Snowflake,
	path: string,
	rconoffset: number
}