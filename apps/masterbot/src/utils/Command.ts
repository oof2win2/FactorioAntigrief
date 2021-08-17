import { SlashCommandBuilder, SlashCommandSubcommandGroupsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { CommandInteraction, Message } from "discord.js";
import { APIMessage } from "discord-api-types";
import FAGCBot from "./FAGCBot.js";

export default interface Command {
	// data: SlashCommandBuilder | SlashCommandSubcommandGroupsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder,
	data: any,
	execute: (client: FAGCBot, interaction: CommandInteraction) => Promise<any>
}