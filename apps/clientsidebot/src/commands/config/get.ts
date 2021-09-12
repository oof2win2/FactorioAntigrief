import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { SubCommand } from "../../base/Command.js"
import FAGCBot from "../../base/fagcbot.js"

const GetConfig: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("get")
		.setDescription("Get the config")
	,
	execute: async (client, interaction) => {
		const config = FAGCBot.GuildConfig
		const configEmbed = new MessageEmbed()
			.setColor(client.getEmbedColor())
			.setTitle("Bot Config")
			.addFields([
				{ name: "Default action on created report", value: config.onReport.toString() },
				{ name: "Default action on created revocation", value: config.onRevocation.toString() },
				{ name: "Role that can create and manage bans", value: `<@${config.banRole}> | ${config.banRole}` },
				{ name: "Role that can manage the bot's configuration", value: `<@${config.configRole}> | ${config.configRole}` },
				{ name: "Role that can manage FAGC notifications", value: `<@${config.notificationsRole}> | ${config.notificationsRole}` },
				{ name: "API key", value: config.apikey ? "Set" : "None" }
			])

		return interaction.reply({ embeds: [configEmbed], ephemeral: true })
	},
}
export default GetConfig