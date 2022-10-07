import { SlashCommandSubcommandGroupBuilder } from "@discordjs/builders"
import {
	executeCommandInteraction,
	SubCommand,
	SubCommandGroup,
} from "../../base/Command"
import { loadSubcommands } from "../../utils/functions"

const commands = loadSubcommands("config", "set") as SubCommand<
	boolean,
	boolean
>[]

const Set: SubCommandGroup = {
	data: new SlashCommandSubcommandGroupBuilder()
		.setName("set")
		.setDescription("Set"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "SubCommandGroup",
	commands,
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Set.data.addSubcommand(command.data)
})

export default Set
