import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
} from "../base/Command"
import { loadSubcommands } from "../utils/functions"

const commands = loadSubcommands("communities")

const Communities: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("communities")
		.setDescription("Communities"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "CommandWithSubcommands",
	commands,
}

commands.forEach((command) => {
	if (command.type === "SubCommand")
		Communities.data.addSubcommand(command.data)
	else Communities.data.addSubcommandGroup(command.data)
})

export default Communities
