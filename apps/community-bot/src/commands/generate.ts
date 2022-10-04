import { readdirSync } from "fs"
import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
	SubCommand,
	SubCommandGroup,
} from "../base/Command"

const commands: (
	| SubCommand<boolean, boolean>
	| SubCommandGroup<boolean, boolean>
)[] = readdirSync("./commands/generate/")
	.filter((command) => command.endsWith(".js"))
	.map((commandName) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const command = require(`./generate/${commandName}`)
		return command.default
	})

const Generate: CommandWithSubcommands<boolean, boolean> = {
	data: new SlashCommandBuilder()
		.setName("generate")
		.setDescription("Generate"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "CommandWithSubcommands",
	requiresApikey: false,
	requiresRoles: false,
	fetchFilters: false,
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Generate.data.addSubcommand(command.data)
	else Generate.data.addSubcommandGroup(command.data)
})

export default Generate
