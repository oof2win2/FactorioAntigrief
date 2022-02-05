import { SlashCommandBuilder } from '@discordjs/builders';
import {Command, CommandWithSubcommands, SubCommand} from '../utils/Command.js';
import { readdirSync } from 'fs';

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/categories").map(async commandName => {
	const command = await import(`./categories/${commandName}`)
	return command.default
}))

const Categories: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("categories")
		.setDescription("FAGC Categories")
		.setDefaultPermission(false)
	,
	execute: async ({client, interaction}) => {
		const subcommand = interaction.options.getSubcommand()!
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return interaction.reply("An error executing the command occured")
		return command.execute({client, interaction})
	}
}

commands.forEach(command => {
	Categories.data.addSubcommand(command.data)
})

export default Categories