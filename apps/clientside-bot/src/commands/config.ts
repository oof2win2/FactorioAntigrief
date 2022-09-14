import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
	SubCommand,
	SubCommandGroup,
} from "../base/Commands.js"
import { readdirSync } from "fs"

const commands: (SubCommand | SubCommandGroup)[] = readdirSync(
	"./commands/config/"
)
	.filter((command) => command.endsWith(".js"))
	.map((commandName) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const command = require(`./config/${commandName}`)
		return command.default
	})

const Config: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("config")
		.setDescription("Config")
		.setDefaultPermission(false),
	execute: (args) => executeCommandInteraction(args, commands),
	permissionType: "configrole",
	type: "CommandWithSubcommands",
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Config.data.addSubcommand(command.data)
	else Config.data.addSubcommandGroup(command.data)
})

export default Config
