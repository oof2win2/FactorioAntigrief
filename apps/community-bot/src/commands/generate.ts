import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
} from "../base/Command"
import { loadSubcommands } from "../utils/functions"

const commands = loadSubcommands("generate")

const Generate: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("generate")
		.setDescription("Generate"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "CommandWithSubcommands",
	commands,
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Generate.data.addSubcommand(command.data)
	else Generate.data.addSubcommandGroup(command.data)
})

export default Generate
