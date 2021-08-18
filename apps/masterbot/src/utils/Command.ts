import { SlashCommandBuilder, SlashCommandSubcommandGroupsOnlyBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message } from "discord.js";
import { APIMessage } from "discord-api-types";
import FAGCBot from "./FAGCBot.js";

export interface Command {
	data: any,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>
}

export interface SubCommand {
	data: SlashCommandSubcommandBuilder,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>
}