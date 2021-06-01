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

// class Command {
// 	public client: FAGCBot
// 	public config: commandConfig
// 	public help: commandHelp
// 	// public run(): void
// 	// public run: (message: Message, args: string[], config: GuildConfig) => void
// 	constructor(client: FAGCBot, {
// 		name = null, // name of command
// 		description = "", // description
// 		usage = "", // usage of command, command and prefix included
// 		examples = [], // examples, command and prefix **not** included
// 		dirname = "potato", // where the command is
// 		enabled = true, // if its enabled
// 		aliases = new Array(), // an array of aliases
// 		botPermissions = new Array(), // an array of bot permissions, checked before command is run
// 		memberPermissions = new Array(), // an array of user permissions, checked before command is run
// 		ownerOnly = false, // owner only, checked before command is run
// 		cooldown = 5000, // gap between commands
// 		requiredConfig = false, // if guild config is required or not
// 		customPermissions = [] // custom role permissions,
// 	}) {
// 		const category = (dirname ? dirname.split(path.sep)[(dirname.split("/")).length - 1] : "Other") // what command category the commands live in
// 		this.client = client // bind client to this.client
// 		this.config = { enabled, memberPermissions, botPermissions, ownerOnly, cooldown, requiredConfig, customPermissions } // some config options
// 		this.help = { name, category, aliases, description, usage, examples } // used for help command
// 	}
// }


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