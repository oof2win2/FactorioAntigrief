import { CommandInteraction } from "discord.js"
import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import FDGLBot from "./fdglbot"
import { FilterObject, GuildConfig } from "@fdgl/types"
import { checkCommandErrors } from "../events/interaction/interactionCreate"

type CommandParams<Apikey extends boolean, hasFilters extends boolean> = {
	client: FDGLBot
	interaction: CommandInteraction<"cached">
	// if Apikey is true, the guildConfig will have an api key GUARANTEED. if it isn't true, it won't be guaranteed
	guildConfig: Apikey extends true
		? GuildConfig & { apikey: string }
		: GuildConfig
	filters: hasFilters extends true ? FilterObject : null
}

export type CommandExecute<
	Apikey extends boolean,
	hasFilters extends boolean
> = {
	execute: (args: CommandParams<Apikey, hasFilters>) => Promise<unknown>
}

type BaseCommand<
	Apikey extends boolean,
	hasFilters extends boolean
> = CommandExecute<Apikey, hasFilters> & {
	requiresRoles: boolean
	requiresApikey: Apikey
	fetchFilters: hasFilters
}

type CommandWithoutGuildConfig<
	Apikey extends boolean,
	hasFilters extends boolean
> = BaseCommand<Apikey, hasFilters> & {
	requiresRoles: false
}

type CommandWithGuildConfig<
	Apikey extends boolean,
	hasFilters extends boolean
> = BaseCommand<Apikey, hasFilters> & {
	requiresRoles: true
	requiredPermissions: (keyof GuildConfig["roles"])[]
}

export type CommandConfig<Apikey extends boolean, hasFilters extends boolean> =
	| CommandWithoutGuildConfig<Apikey, hasFilters>
	| CommandWithGuildConfig<Apikey, hasFilters>

export type SlashCommand<Apikey extends boolean, hasFilters extends boolean> =
	| CommandWithSubcommands
	| Command<Apikey, hasFilters>
	| SubCommand<Apikey, hasFilters>
	| SubCommandGroup

export type CommandWithSubcommands = CommandExecute<boolean, boolean> & {
	data: SlashCommandBuilder
	type: "CommandWithSubcommands"
	commands: (SubCommand<boolean, boolean> | SubCommandGroup)[]
}

export type SubCommandGroup = CommandExecute<boolean, boolean> & {
	data: SlashCommandSubcommandGroupBuilder
	type: "SubCommandGroup"
	commands: SubCommand<boolean, boolean>[]
}

export type Command<
	Apikey extends boolean,
	hasFilters extends boolean
> = CommandConfig<Apikey, hasFilters> & {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
	type: "Command"
}

export type SubCommand<
	Apikey extends boolean,
	hasFilters extends boolean
> = CommandConfig<Apikey, hasFilters> & {
	data: SlashCommandSubcommandBuilder
	type: "SubCommand"
}

export async function executeCommandInteraction<
	Apikey extends boolean,
	hasFilters extends boolean
>(
	args: CommandParams<Apikey, hasFilters>,
	commands: (SubCommand<Apikey, hasFilters> | SubCommandGroup)[]
) {
	const subcommand = args.interaction.options.getSubcommand()
	const group = args.interaction.options.getSubcommandGroup(false)

	const command = commands.find(
		(c) => c.data.name === subcommand || c.data.name === group
	)

	if (!command)
		return args.interaction.reply(
			"An error finding the command to execute occured"
		)

	const error = await checkCommandErrors(
		command,
		args.interaction,
		args.client,
		args.interaction.member,
		args.guildConfig,
		args.filters
	)
	if (error !== null) return args.interaction.reply(error)

	return command.execute(args)
}
