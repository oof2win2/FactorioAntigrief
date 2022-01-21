import { Message } from "discord.js";
import FAGCBot from "./fagcbot";
import {GuildConfig} from "fagc-api-types"

type CommandRunOpts = {
	client: FAGCBot
	message: Message<true> & Message<boolean>
	args: string[]
	guildConfig: GuildConfig
}

type BaseCommand = {
	name: string,
	description: string,
	usage: string,
	aliases: string[],
	examples: string[],
	category: string,
	requiresRoles: boolean
	requiresApikey: boolean
}

type CommandWithoutGuildConfig = BaseCommand & {
	requiresRoles: false
	run: (args: CommandRunOpts) => unknown
}

type CommandWithGuildConfig = BaseCommand & {
	requiresRoles: true
	requiredPermissions: (keyof GuildConfig["roles"])[]
	run: (args: CommandRunOpts) => unknown
}

export type Command = CommandWithoutGuildConfig | CommandWithGuildConfig