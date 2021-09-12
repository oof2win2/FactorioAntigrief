import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import FAGCBot from "./fagcbot"

export enum PermissionOverrideType {
	ROLE = 1,
	USER = 2,
}
export type PermissionOverride = {
	id: string
	type: PermissionOverrideType.ROLE
	permission: boolean
} | {
	id: string
	type: PermissionOverrideType.USER
	permission: boolean
}

export interface CommandWithSubcommands {
	data: SlashCommandBuilder,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>
	permission_overrides?: PermissionOverride[]
}

export interface Command {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>,
	permission_overrides?: PermissionOverride[]
}

export interface SubCommand {
	data: SlashCommandSubcommandBuilder,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>
	permission_overrides?: PermissionOverride[]
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
