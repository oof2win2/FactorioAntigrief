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
	/**
	 * ID of user or role to set override for
	 */
	id: string
	/**
	 * Type of the override
	 */
	type: PermissionOverrideType.ROLE | PermissionOverrideType.USER
	/**
	 * Is the user or role allowed to access this command?
	 */
	permission: boolean
}

type PermissionType = "banrole" | "configrole" | "notificationsrole"

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