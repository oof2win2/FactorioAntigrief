import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {SubCommand} from "../../base/Command.js"

const Ban: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("ban")
		.setDescription("Ban a user")
		.addStringOption(option =>
			option
				.setName("name")
				.setDescription("Name of player to ban")
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName("reason")	
				.setDescription("Reason for banning")
				.setRequired(false)
		)
		,
	execute: async (client, interaction) => {
		const nameOption = interaction.options.get("name")
		if (nameOption.type !== "STRING" || typeof nameOption.value !== "string") return interaction.reply("An error occured")
		const name = nameOption.value

		const reasonOption = interaction.options.get("reason")
		const reason = typeof reasonOption?.value === "string" ? reasonOption.value : "No reason provided"
		
		const existing = await client.prisma.privateBans.findFirst({
			where: {
				playername: name
			}
		})
		if (existing) return interaction.reply(`${name} is already banned`)

		const whitelist = await client.prisma.privateBans.create({
			data: {
				playername: name,
				admin: interaction.user.id,
				reason: reason
			}
		})
		return interaction.reply(`${name} has been banned for ${reason}`)
	}
}
export default Ban