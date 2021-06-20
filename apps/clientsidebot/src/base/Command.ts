import FAGCBot from "./fagcbot"
import { Message } from "discord.js"
import { GuildConfig } from ".prisma/client"
import { PermissionResolvable } from "discord.js"

type customPermission = 
	| "ban"
	| "config"
	| "notifications"

// the user must EITHER have the roles OR they must have the Discord permissions. can't mix.
export type Command <T=void> = {
	name: string,
	description: string,
	usage?: string,
	examples?: string[],
	dirname: string,
	enabled: boolean,
	ownerOnly: boolean,
	requiredConfig: boolean,
	cooldown: number,
	aliases: string[],
	botPermissions?: PermissionResolvable[],
	memberPermissions?: PermissionResolvable[],
	customPermissions?: customPermission[],
	run: (
		client: FAGCBot,
		message: Message,
		args: string[],
		botconfig?: GuildConfig
	) => Promise<T>,
}

export default Command
// module.exports = Command