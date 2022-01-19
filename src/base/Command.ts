import { Message } from "discord.js";
import FAGCBot from "./fagcbot";
import {GuildConfig} from "fagc-api-types"

interface CommandRunOpts {
	client: FAGCBot
	message: Message
	args: string[]
}
interface CommandRunWithGuildconfigOpts extends CommandRunOpts {
	guildConfig: GuildConfig
}
type BaseCommand = {
	name: string,
	description: string,
	usage: string,
	aliases: string[],
	examples: string[],
	category: string,
	requiredsGuildConfig: boolean
}

type CommandWithoutGuildConfig = BaseCommand & {
	requiredsGuildConfig: false
	run: (args: CommandRunOpts) => unknown
}

type CommandWithGuildConfig = BaseCommand & {
	requiredsGuildConfig: true
	requiredGuildConfigPermissions: (keyof GuildConfig["roles"])[]
	run: (args: CommandRunWithGuildconfigOpts) => unknown
}

export type Command = CommandWithoutGuildConfig | CommandWithGuildConfig