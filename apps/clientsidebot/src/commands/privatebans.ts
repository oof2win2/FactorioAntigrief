import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandWithSubcommands, PermissionOverrideType, SubCommand } from "../base/Commands.js"
import { readdirSync } from "fs"
import ENV from "../utils/env.js"
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums"

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/privatebans/")
	.filter(command => command.endsWith(".js"))
	.map(async commandName => {
		const command = await import(`./privatebans/${commandName}`)
		return command.default
	}))

const Bans: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("privatebans")
		.setDescription("Private bans")
		.setDefaultPermission(false)
	,
	execute: async (args) => {
		const subcommand = args.interaction.options.getSubcommand()
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return args.interaction.reply("An error executing the command occured")
		return command.execute(args)
	},
	permissionType: "banrole",
}

commands.forEach(command => {
	Bans.data.addSubcommand(command.data)
})

export default Bans