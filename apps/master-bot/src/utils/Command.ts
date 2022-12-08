import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import {
	GuildApplicationCommandPermissionData,
	CommandInteraction,
} from "discord.js"
import FDGLBot from "./FDGLBot.js"

interface CommandParams {
	client: FDGLBot
	interaction: CommandInteraction
}

interface BaseCommand {
	execute: (params: CommandParams) => Promise<unknown>
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
