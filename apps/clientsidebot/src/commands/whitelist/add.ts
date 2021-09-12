import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {SubCommand} from "../../base/Command.js"

const AddWhitelist: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("add")
		.setDescription("Add a user to the whitelist")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Name of player to whitelist")
				.setRequired(true)
		)
		,
	execute: async (client, interaction) => {
		const name = interaction.options.get("name")
		if (name.type !== "STRING" || typeof name.value !== "string") return interaction.reply("An error occured")
		const whitelist = await client.prisma.whitelist.create({
			data: {
				playername: name.value,
				whitelistedBy: interaction.user.id,
				whitelistedAt: new Date()
			}
		})
		return interaction.reply(`${name.value} has been whitelisted`)
	}
}
export default AddWhitelist