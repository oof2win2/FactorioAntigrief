import {
	SlashCommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import {
	executeCommandInteraction,
	SubCommand,
	SubCommandGroup,
} from "../../base/Commands.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = readdirSync("./commands/config/linkedadmins/")
	.filter((command) => command.endsWith(".js"))
	.map((commandName) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const command = require(`./linkedadmins/${commandName}`)
		return command.default
	})

const Config: SubCommandGroup = {
	type: "SubCommandGroup",
	data: new SlashCommandSubcommandGroupBuilder()
		.setName("linkedadmins")
		.setDescription("Linked admins"),
	execute: (args) => executeCommandInteraction(args, commands),
	permissionType: "configrole",
}

commands.forEach((command) => {
	Config.data.addSubcommand(command.data)
})

export default Config
