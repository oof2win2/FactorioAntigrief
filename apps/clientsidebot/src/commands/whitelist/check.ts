import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {SubCommand} from "../../base/Command.js"

const CheckWhitelist: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("check")
		.setDescription("Check whether a user is whitelisted")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Name of player to check")
				.setRequired(true)
		)
		,
	execute: async (client, interaction) => {
		const name = interaction.options.get("name")
		if (name.type !== "STRING" || typeof name.value !== "string") return interaction.reply("An error occured")
		const whitelist = await client.prisma.whitelist.findFirst({
			where: {
				playername: name.value
			}
		})
		if (!whitelist) return interaction.reply(`Player ${name.value} is not whitelisted`)
		return interaction.reply(`${name.value} is whitelisted since <t:${Math.round(whitelist.whitelistedAt.valueOf()/1000)}> by ${await client.users.fetch(whitelist.whitelistedBy).then(u=>u.tag)}`)
	}
}
export default CheckWhitelist