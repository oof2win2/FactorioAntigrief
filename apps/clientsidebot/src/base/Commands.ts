import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import FAGCBot from "./FAGCBot.js"
import { BotConfigType } from "./database.js"

interface CommandParams {
	client: FAGCBot,
	interaction: CommandInteraction
	botConfig: BotConfigType
}

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

type PermissionType = {
	type: "banrole"
} | {
	type: "configrole"
} | {
	type: "notificationsrole"
}

interface BaseCommand {
	execute: (params: CommandParams) => Promise<unknown>
	permissionType?: PermissionType
	permissionOverrides?: PermissionOverride[]
}

export interface CommandWithSubcommands extends BaseCommand {
	data: SlashCommandBuilder
}

export interface Command extends BaseCommand {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
}

export interface SubCommand extends BaseCommand {
	data: SlashCommandSubcommandBuilder
}