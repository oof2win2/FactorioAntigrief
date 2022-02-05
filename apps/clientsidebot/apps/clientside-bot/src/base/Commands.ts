import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildApplicationCommandPermissionData, CommandInteraction } from "discord.js"
import FAGCBot from "./FAGCBot.js"
import { BotConfigType } from "./database.js"

interface CommandParams {
	client: FAGCBot,
	interaction: CommandInteraction<"present">
	botConfig: BotConfigType
}

export enum PermissionOverrideType {
	ROLE = 1,
	USER = 2,
}

type PermissionType = "banrole" | "configrole" | "notificationsrole"

interface BaseCommand {
	execute: (params: CommandParams) => Promise<unknown>
	permissionType?: PermissionType
	permissionOverrides?: GuildApplicationCommandPermissionData["permissions"]
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