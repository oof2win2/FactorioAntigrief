import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import FAGCBot from "./FAGCBot.js"
import { BotConfigType } from "./database.js"

interface CommandParams {
	client: FAGCBot,
	interaction: CommandInteraction
	botConfig: BotConfigType
}

type CommandData =
	| Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
	| SlashCommandSubcommandBuilder

export interface CommandWithSubcommands {
	data: SlashCommandBuilder,
	execute: (params: CommandParams) => Promise<unknown>
}

export interface Command {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
	execute: (params: CommandParams) => Promise<unknown>,
}

export interface SubCommand {
	data: SlashCommandSubcommandBuilder,
	execute: (params: CommandParams) => Promise<unknown>
}