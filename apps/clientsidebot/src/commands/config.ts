import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandWithSubcommands, SubCommand } from "../base/Commands.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/config/")
	.filter(command => command.endsWith(".js"))
	.map(async commandName => {
		const command = await import(`./config/${commandName}`)
		return command.default
	}))

const Bans: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("config")
		.setDescription("Config")
	,
	execute: async (args) => {
		const subcommand = args.interaction.options.getSubcommand()
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return args.interaction.reply("An error executing the command occured")
		return command.execute(args)
	},
}

commands.forEach(command => {
	Bans.data.addSubcommand(command.data)
})

export default Bans