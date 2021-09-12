import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { APIMessage } from "discord-api-types"
import FAGCBot from "./fagcbot"

export interface Command {
	data: SlashCommandBuilder,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>
}

export interface SubCommand {
	data: SlashCommandSubcommandBuilder,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>
}

// export type Command <T=void> = {
// 	name: string,
// 	description: string,
// 	usage?: string,
// 	examples?: string[],
// 	category: string,
// 	enabled: boolean,
// 	ownerOnly: boolean,
// 	requiredConfig: boolean,
// 	cooldown: number,
// 	aliases: string[],
// 	botPermissions?: PermissionResolvable[],
// 	memberPermissions?: PermissionResolvable[],
// 	customPermissions?: customPermission[],
// 	run: (
// 		client: FAGCBot,
// 		message: Message,
// 		args: string[],
// 		botconfig?: GuildConfig
// 	) => Promise<T>,
// }
