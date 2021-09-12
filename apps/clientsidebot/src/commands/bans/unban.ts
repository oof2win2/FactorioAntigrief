import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {SubCommand} from "../../base/Command.js"

const Unban: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("unban")
		.setDescription("Unban a user")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Name of player to check")
				.setRequired(true)
		),
	execute: async (client, interaction) => {
		const name = interaction.options.get("name")
		if (name.type !== "STRING" || typeof name.value !== "string") return interaction.reply("An error occured")
		
		const whitelist = await client.prisma.privateBans.deleteMany({
			where: {
				playername: name.value,
			}
		})
		if (whitelist.count) return interaction.reply(`${name.value} was unbanned`)
		return interaction.reply(`${name.value} was not banned`)
	}
}
export default Unban