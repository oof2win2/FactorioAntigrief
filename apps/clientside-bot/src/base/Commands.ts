import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import {
	GuildApplicationCommandPermissionData,
	CommandInteraction,
} from "discord.js"
import FAGCBot from "./FAGCBot.js"
import { BotConfigType } from "./database.js"

interface CommandParams {
	client: FAGCBot
	interaction: CommandInteraction<"cached">
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
	type: "CommandWithSubcommands"
}

export interface Command extends BaseCommand {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
	type: "Command"
}

export interface SubCommand extends BaseCommand {
	data: SlashCommandSubcommandBuilder
	type: "SubCommand"
}

export interface SubCommandGroup extends BaseCommand {
	data: SlashCommandSubcommandGroupBuilder
	type: "SubCommandGroup"
}

export function executeCommandInteraction(
	args: CommandParams,
	commands: (SubCommand | SubCommandGroup)[]
) {
	const subcommand = args.interaction.options.getSubcommand()
	const group = args.interaction.options.getSubcommandGroup(true)
	const command = commands.find(
		(command) =>
			command.data.name === subcommand || command.data.name === group
	)
	if (!command)
		return args.interaction.reply(
			"An error finding the command to execute occured"
		)
	return command.execute(args)
}
