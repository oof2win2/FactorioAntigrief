import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import {SubCommand} from "../../base/Command.js"
import FAGCBot from "../../base/fagcbot.js"

const Setup: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("set")
		.setDescription("Set the config")
		.addStringOption(option =>
			option
				.setName("reportaction")
				.setDescription("Action to perform on a new report if it matches filtered criteria")
				.addChoice("Only send an info message", "info")
				.addChoice("Jail the player", "jail")
				.addChoice("Ban the player", "ban")
		)
		.addStringOption(option =>
			option
				.setName("revocationaction")
				.setDescription("Action to perform on a new revocation if it matches filtered criteria")
				.addChoice("Only send an info message", "info")
				.addChoice("Unban the player", "removeBan")
		)
		.addRoleOption(option =>
			option
				.setName("adminrole")
				.setDescription("Role that can perform actions")
		)
		.addStringOption(option =>
			option
				.setName("apikey")
				.setDescription("FAGC API key")
		)
	,
	execute: async (client, interaction) => {
		const reportaction = interaction.options.getString("reportaction")
		const revocationaction = interaction.options.getString("revocationaction")
		const adminrole = interaction.options.getRole("adminrole")
		const apikey = interaction.options.getString("apikey")

		if (
			!reportaction &&
			!revocationaction && 
			!adminrole && 
			!apikey
		) return interaction.reply("No change has been made to your config")
		
		const existingConfig = await client.prisma.guildConfig.findFirst()
		if (existingConfig) {
			const newConfig = await client.prisma.guildConfig.update({
				where: {
					id: 1
				},
				data: {
					onReport: reportaction || existingConfig.onReport,
					onRevocation: revocationaction || existingConfig.onRevocation,
					banRole: adminrole?.id || existingConfig.banRole,
					configRole: adminrole?.id ?? existingConfig.configRole,
					notificationsRole: adminrole?.id || existingConfig.notificationsRole,
					guildId: interaction.guild.id,
					apikey: apikey || "",
					
				}
			})
			FAGCBot.GuildConfig = newConfig
		} else {
			const newConfig = await client.prisma.guildConfig.create({
				data: {
					onReport: reportaction || "info",
					onRevocation: revocationaction || "info",
					banRole: adminrole?.id || "",
					configRole: adminrole?.id ?? "",
					notificationsRole: adminrole?.id || "",
					guildId: interaction.guild.id,
					apikey: apikey || ""
				}
			})
			FAGCBot.GuildConfig = newConfig
		}

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

		return interaction.reply({content: "Config changed. If you want to more precisely set your role access, please use /config setpermissions", embeds: [configEmbed]})
	},
}
export default Setup