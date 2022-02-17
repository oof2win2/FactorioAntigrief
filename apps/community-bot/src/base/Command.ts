import { Message } from "discord.js"
import FAGCBot from "./fagcbot"
import { GuildConfig } from "fagc-api-types"

type CommandRunOpts<Apikey extends boolean> = {
	client: FAGCBot
	message: Message<true> & Message<boolean>
	args: string[]
	// if Apikey is true, the guildConfig will have an api key GUARANTEED. if it isn't true, it won't be guaranteed
	guildConfig: Apikey extends true
		? GuildConfig & { apikey: string }
		: GuildConfig
}

type BaseCommand = {
	name: string
	description: string
	usage: string
	aliases: string[]
	examples: string[]
	category: string
	requiresRoles: boolean
	requiresApikey: boolean
	run: (args: CommandRunOpts<false>) => unknown
} & (
	| {
			requiresApikey: true
			run: (args: CommandRunOpts<true>) => unknown
	  }
	| {
			requiresApikey: false
	  }
)

type CommandWithoutGuildConfig = BaseCommand & {
	requiresRoles: false
}

type CommandWithGuildConfig = BaseCommand & {
	requiresRoles: true
	requiredPermissions: (keyof GuildConfig["roles"])[]
}

export type Command = CommandWithoutGuildConfig | CommandWithGuildConfig
