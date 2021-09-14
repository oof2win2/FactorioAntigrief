import { SlashCommandBuilder } from "@discordjs/builders"
import {CommandWithSubcommands, SubCommand} from "../base/Command.js"
import { readdirSync } from "fs"

const commands: SubCommand[] = await Promise.all(readdirSync("./commands/whitelist/").map(async commandName => {
	const command = await import(`./whitelist/${commandName}`)
	return command.default
}))

const Whitelist: CommandWithSubcommands = {
	data: new SlashCommandBuilder()
		.setName("whitelist")
		.setDescription("Whitelist")
		.setDefaultPermission(false)
	,
	execute: async (client, interaction) => {
		const subcommand = interaction.options.getSubcommand()!
		const command = commands.find(command => command.data.name === subcommand)
		if (!command) return interaction.reply("An error executing the command occured")
		return command.execute(client, interaction)
	},
	permissionType: {
		type: "banrole"
	}
}

commands.forEach(command => {
	Whitelist.data.addSubcommand(command.data)
})

export default Whitelist