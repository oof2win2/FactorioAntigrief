import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
} from "../base/Command"
import { loadSubcommands } from "../utils/functions"

const commands = loadSubcommands("config")

const Config: CommandWithSubcommands = {
	data: new SlashCommandBuilder().setName("config").setDescription("Config"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "CommandWithSubcommands",
	commands,
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Config.data.addSubcommand(command.data)
	else Config.data.addSubcommandGroup(command.data)
})

export default Config
