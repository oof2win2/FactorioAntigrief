import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {SubCommand} from "../../base/Command.js"

const CheckBan: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("check")
		.setDescription("Check whether a user is banned")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Name of player to check")
				.setRequired(true)
		),
	execute: async (client, interaction) => {
		const name = interaction.options.get("name")
		if (name.type !== "STRING" || typeof name.value !== "string") return interaction.reply("An error occured")
		const ban = await client.prisma.privateBans.findFirst({
			where: {
				playername: name.value,
			}
		})
		if (ban) return interaction.reply(`${name.value} was banned for ${ban.reason} at <t:${Math.round(ban.bannedAt.valueOf()/1000)}> by ${await client.users.fetch(ban.admin).then(u=>u.tag)}`)
		return interaction.reply(`${name.value} is not banned`)
	}
}
export default CheckBan