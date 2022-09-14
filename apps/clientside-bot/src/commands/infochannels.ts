import { SlashCommandBuilder } from "@discordjs/builders"
import {
	CommandWithSubcommands,
	executeCommandInteraction,
	PermissionOverrideType,
	SubCommand,
	SubCommandGroup,
} from "../base/Commands.js"
import { readdirSync } from "fs"
import ENV from "../utils/env.js"
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums"

const commands: (SubCommand | SubCommandGroup)[] = readdirSync(
	"./commands/infochannels/"
)
	.filter((command) => command.endsWith(".js"))
	.map((commandName) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const command = require(`./infochannels/${commandName}`)
		return command.default
	})

const Bans: CommandWithSubcommands = {
	type: "CommandWithSubcommands",
	data: new SlashCommandBuilder()
		.setName("infochannels")
		.setDescription("Info channels")
		.setDefaultPermission(false),
	execute: (args) => executeCommandInteraction(args, commands),
	permissionType: "notificationsrole",
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Bans.data.addSubcommand(command.data)
	else Bans.data.addSubcommandGroup(command.data)
})

export default Bans
