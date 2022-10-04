import { CommandInteraction } from "discord.js"
import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import FAGCBot from "./fagcbot"
import { FilterObject, GuildConfig } from "fagc-api-types"

type CommandParams<Apikey extends boolean, hasFilters extends boolean> = {
	client: FAGCBot
	interaction: CommandInteraction<"cached">
	// if Apikey is true, the guildConfig will have an api key GUARANTEED. if it isn't true, it won't be guaranteed
	guildConfig: Apikey extends true
	? GuildConfig & { apikey: string }
	: GuildConfig
	filters: hasFilters extends true ? FilterObject : null
}

type BaseCommand<Apikey extends boolean, hasFilters extends boolean> = {
	requiresRoles: boolean
	requiresApikey: Apikey
	fetchFilters: hasFilters
	execute: (args: CommandParams<Apikey, hasFilters>) => Promise<unknown>
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

export type Command<
	Apikey extends boolean,
	hasFilters extends boolean
> = CommandConfig<Apikey, hasFilters> & {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
	type: "Command"
}

export type CommandWithSubcommands<
	Apikey extends boolean,
	hasFilters extends boolean
> = CommandConfig<Apikey, hasFilters> & {
	data: SlashCommandBuilder
	type: "CommandWithSubcommands"
}

export type SubCommand<
	Apikey extends boolean,
	hasFilters extends boolean
> = CommandConfig<Apikey, hasFilters> & {
	data: SlashCommandSubcommandBuilder
	type: "SubCommand"
}

export type SubCommandGroup<
	Apikey extends boolean,
	hasFilters extends boolean
> = CommandConfig<Apikey, hasFilters> & {
	data: SlashCommandSubcommandGroupBuilder
	type: "SubCommandGroup"
}

export function executeCommandInteraction<
	Apikey extends boolean,
	hasFilters extends boolean
>(
	args: CommandParams<Apikey, hasFilters>,
	commands: (
		| SubCommand<Apikey, hasFilters>
		| SubCommandGroup<Apikey, hasFilters>
	)[]
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

	return command.execute(args)
}
