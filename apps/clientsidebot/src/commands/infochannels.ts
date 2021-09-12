import { SlashCommandBuilder } from "@discordjs/builders"
import {Command, SubCommand} from "../base/Command.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/infochannels/").map(async commandName => {
	const command = await import(`./infochannels/${commandName}`)
	return command.default
}))

const Infochannels: Command = {
	data: new SlashCommandBuilder()
		.setName("infochannels")
		.setDescription("Infochannels")
	,
	execute: async (client, interaction) => {
		const subcommand = interaction.options.getSubcommand()!
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return interaction.reply("An error executing the command occured")
		return command.execute(client, interaction)
	}
}

commands.forEach(command => {
	Infochannels.data.addSubcommand(command.data)
})

export default Infochannels