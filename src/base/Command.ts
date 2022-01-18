import { Message } from "discord.js";
import FAGCBot from "./fagcbot";

interface CommandRunOpts {
	client: FAGCBot
	message: Message
	args: string[]
}

export type Command<T> = {
	name: string,
	description: string,
	usage: string,
	aliases: string[],
	examples: string[],
	category: string,
	run: (args: CommandRunOpts) => T
}