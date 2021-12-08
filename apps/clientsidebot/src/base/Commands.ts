import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import FAGCBot from "./FAGCBot.js"

export interface Command {
	data: SlashCommandBuilder,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<unknown>
}

export interface SubCommand {
	data: SlashCommandSubcommandBuilder,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<unknown>
}