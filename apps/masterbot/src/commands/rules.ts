import { SlashCommandBuilder } from '@discordjs/builders';
import {Command, SubCommand} from '../utils/Command.js';
import { readdirSync } from 'fs';

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/rules").map(async commandName => {
	const command = await import(`./rules/${commandName}`)
	return command.default
}))

const Rules: Command = {
	data: new SlashCommandBuilder()
		.setName("rules")
		.setDescription("FAGC Rules")
	,
	execute: async (client, interaction) => {
		const subcommand = interaction.options.getSubcommand()!
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return interaction.reply("An error executing the command occured")
		return command.execute(client, interaction)
	}
}

commands.forEach(command => {
	Rules.data.addSubcommand(command.data)
})

export default Rules