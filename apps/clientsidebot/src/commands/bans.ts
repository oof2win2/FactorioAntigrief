import { SlashCommandBuilder } from "@discordjs/builders"
import {Command, SubCommand} from "../base/Command.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/bans/").map(async commandName => {
	const command = await import(`./bans/${commandName}`)
	return command.default
}))

const Bans: Command = {
	data: new SlashCommandBuilder()
		.setName("bans")
		.setDescription("Bans")
	,
	execute: async (client, interaction) => {
		const subcommand = interaction.options.getSubcommand()!
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return interaction.reply("An error executing the command occured")
		return command.execute(client, interaction)
	}
}

commands.forEach(command => {
	Bans.data.addSubcommand(command.data)
})

export default Bans