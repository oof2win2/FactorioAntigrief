import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
} from "../base/Command"
import { loadSubcommands } from "../utils/functions"

const commands = loadSubcommands("categories")

const Categories: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("categories")
		.setDescription("Categories"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "CommandWithSubcommands",
	commands,
}

commands.forEach((command) => {
	if (command.type === "SubCommand")
		Categories.data.addSubcommand(command.data)
	else Categories.data.addSubcommandGroup(command.data)
})

export default Categories
