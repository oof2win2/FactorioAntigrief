import { Snowflake } from "discord.js";

export interface FactorioServer {
	name: string,
	discordname: string,
	discordid: Snowflake,
	logPath: string,
	joinPath: string,
	rconoffset: number,
	watch: boolean,
}