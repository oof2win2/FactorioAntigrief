import { Message } from "discord.js"
import FAGCBot from "./fagcbot"
import { FilterObject, GuildConfig } from "fagc-api-types"

type CommandRunOpts<Apikey extends boolean, hasFilters extends boolean> = {
	client: FAGCBot
	message: Message<true> & Message<boolean>
	args: string[]
	// if Apikey is true, the guildConfig will have an api key GUARANTEED. if it isn't true, it won't be guaranteed
	guildConfig: Apikey extends true
		? GuildConfig & { apikey: string }
		: GuildConfig
	filters: hasFilters extends true ? FilterObject : null
}

type BaseCommand<T extends boolean, U extends boolean> = {
	name: string
	description: string
	usage: string
	aliases: string[]
	examples: string[]
	category: string
	requiresRoles: boolean
	requiresApikey: T
	fetchFilters: U
	run: (args: CommandRunOpts<T, U>) => unknown
}

type CommandWithoutGuildConfig<
	T extends boolean,
	U extends boolean
> = BaseCommand<T, U> & {
	requiresRoles: false
}

type CommandWithGuildConfig<T extends boolean, U extends boolean> = BaseCommand<
	T,
	U
> & {
	requiresRoles: true
	requiredPermissions: (keyof GuildConfig["roles"])[]
}

export type Command<T extends boolean, U extends boolean> =
	| CommandWithoutGuildConfig<T, U>
	| CommandWithGuildConfig<T, U>
export const Command = <T extends boolean, U extends boolean>(
	args: Command<T, U>
) => args
