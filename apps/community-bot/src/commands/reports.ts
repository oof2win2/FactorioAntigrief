import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
} from "../base/Command"
import { loadSubcommands } from "../utils/functions"

const commands = loadSubcommands("reports")

const Reports: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("reports")
		.setDescription("Reports"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "CommandWithSubcommands",
	commands,
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Reports.data.addSubcommand(command.data)
	else Reports.data.addSubcommandGroup(command.data)
})

export default Reports
