import { SlashCommandBuilder } from '@discordjs/builders';
import {CommandWithSubcommands, SubCommand} from '../utils/Command.js';
import { readdirSync } from 'fs';

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/communities").map(async commandName => {
	const command = await import(`./communities/${commandName}`)
	return command.default
}))

const Communities: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("communities")
		.setDescription("FAGC Communities")
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
	Communities.data.addSubcommand(command.data)
})

export default Communities