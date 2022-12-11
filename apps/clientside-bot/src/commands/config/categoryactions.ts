import { SlashCommandSubcommandGroupBuilder } from "@discordjs/builders"
import {
	executeCommandInteraction,
	SubCommand,
	SubCommandGroup,
} from "../../base/Commands.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = readdirSync("./commands/config/categoryactions/")
	.filter((command) => command.endsWith(".js"))
	.map((commandName) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const command = require(`./categoryactions/${commandName}`)
		return command.default
	})

const CategoryActions: SubCommandGroup = {
	type: "SubCommandGroup",
	data: new SlashCommandSubcommandGroupBuilder()
		.setName("categoryactions")
		.setDescription("Category actions"),
	execute: (args) => executeCommandInteraction(args, commands),
	permissionType: "configrole",
}

commands.forEach((command) => {
	CategoryActions.data.addSubcommand(command.data)
})

export default CategoryActions
