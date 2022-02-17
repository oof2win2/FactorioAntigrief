import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	PermissionOverrideType,
	SubCommand,
} from "../base/Commands.js"
import { readdirSync } from "fs"
import ENV from "../utils/env.js"
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums"

const commands: SubCommand[] = readdirSync("./commands/whitelist/")
	.filter((command) => command.endsWith(".js"))
	.map((commandName) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const command = require(`./whitelist/${commandName}`)
		return command.default
	})

const Bans: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("whitelist")
		.setDescription("Whitelist")
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
	Bans.data.addSubcommand(command.data)
})

export default Bans
