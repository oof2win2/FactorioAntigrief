import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	PermissionOverrideType,
	SubCommand,
} from "../base/Commands.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = readdirSync("./commands/config/")
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
	execute: async (args) => {
		const subcommand = args.interaction.options.getSubcommand()
		const command = commands.find(
			(command) => command.data.name === subcommand
		)
		if (!command)
			return args.interaction.reply(
				"An error executing the command occured"
			)
		return command.execute(args)
	},
	permissionType: "configrole",
}

commands.forEach((command) => {
	Config.data.addSubcommand(command.data)
})

export default Config
