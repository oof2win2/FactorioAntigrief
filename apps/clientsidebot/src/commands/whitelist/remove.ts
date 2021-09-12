import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {SubCommand} from "../../base/Command.js"

const UnWhitelist: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove a player from the whitelist")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Name of player to un-whitelist")
				.setRequired(true)
		)
		,
	execute: async (client, interaction) => {
		const name = interaction.options.get("name")
		if (name.type !== "STRING" || typeof name.value !== "string") return interaction.reply("An error occured")
		const whitelist = await client.prisma.whitelist.deleteMany({
			where: {
				playername: name.value
			}
		})
		if (whitelist.count) return interaction.reply(`${name.value} has been un-whitelisted`)
		return interaction.reply(`${name.value} was not whitelisted`)
	}
}
export default UnWhitelist