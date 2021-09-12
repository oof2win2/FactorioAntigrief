import { SlashCommandBuilder } from "@discordjs/builders"
import {CommandWithSubcommands, PermissionOverrideType, SubCommand} from "../base/Command.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/config/").map(async commandName => {
	const command = await import(`./config/${commandName}`)
	return command.default
}))

const Config: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("config")
		.setDescription("Bot Config")
		.setDefaultPermission(false)
	,
	execute: async (client, interaction) => {
		const subcommand = interaction.options.getSubcommand()!
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return interaction.reply("An error executing the command occured")
		return command.execute(client, interaction)
	}
}

commands.forEach(command => {
	Config.data.addSubcommand(command.data)
})

export default Config