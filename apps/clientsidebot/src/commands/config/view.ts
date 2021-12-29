import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { z } from "zod"
import { SubCommand } from "../../base/Commands.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("View your bot config")
	,
	execute: async ({ client, interaction, botConfig }) => {
		const embed = new MessageEmbed()
			.setTitle("Current bot config")
		const ownerUser = await client.users.fetch(botConfig.owner)
		embed.addFields([
			{ name: "Bot Owner", value: `<@${ownerUser.id}> | ${ownerUser.tag}` , inline: true },
			{ name: "Report Action", value: botConfig.reportAction, inline: true },
			{ name: "Revocation action", value: botConfig.revocationAction, inline: true },
			{ name: "API key", value: botConfig.apikey ? "Set" : "None", inline: true },
		])
		return interaction.reply({
			ephemeral: true,
			embeds: [ embed ]
		})
	}
}
export default Setaction