import * as path from "path"
import FAGCBot from "./fagcbot"
import { Message } from "discord.js"
import { GuildConfig } from ".prisma/client"
import { PermissionResolvable, TextChannel, NewsChannel } from "discord.js"

interface commandConfig {
	enabled: boolean,
	memberPermissions: string[],
	botPermissions: string[],
	ownerOnly: boolean,
	cooldown: number,
	requiredConfig: boolean,
	customPermissions: string[]
}
interface commandHelp {
	name: string,
	category: string,
	aliases: string[],
	description: string | boolean,
	usage: string | boolean,
	examples: string[] | boolean,
}

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
	customPermissions?: string[],
	run: (
		client: FAGCBot,
		message: Message,
		args: string[],
		botconfig?: GuildConfig
	) => Promise<T>,
}

export default Command
// module.exports = Command