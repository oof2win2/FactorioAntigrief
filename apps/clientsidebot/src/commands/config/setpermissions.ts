import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import {SubCommand} from "../../base/Command.js"
import FAGCBot from "../../base/fagcbot.js"

const Setup: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("setpermissions")
		.setDescription("Set permissions")
		.addRoleOption(option =>
			option
				.setName("banrole")
				.setDescription("Role that can ban")
		)
		.addRoleOption(option =>
			option
				.setName("configrole")
				.setDescription("Role that can manage config")
		)
		.addRoleOption(option =>
			option
				.setName("notificationsrole")
				.setDescription("Role that can manage notifications")
		)
	,
	execute: async (client, interaction) => {
		const banrole = interaction.options.getRole("banrole")
		const configrole = interaction.options.getRole("configrole")
		const notificationsrole = interaction.options.getRole("notificationsrole")
		
		if (
			!banrole &&
			!configrole && 
			!notificationsrole
		) return interaction.reply("No change has been made to your config")
		
		const existingConfig = await client.prisma.guildConfig.findFirst()
		if (!existingConfig) return interaction.reply("You don't have a config yet! Create one first")
		const newConfig = await client.prisma.guildConfig.update({
			where: {
				id: 1
			},
			data: {
				banRole: banrole?.id || existingConfig.banRole,
				configRole: configrole?.id ?? existingConfig.configRole,
				notificationsRole: notificationsrole?.id || existingConfig.notificationsRole,
			}
		})
		FAGCBot.GuildConfig = newConfig

		const configEmbed = new MessageEmbed()
			.setColor(client.getEmbedColor())
			.setTitle("Permissions Config")
			.addFields([
				{ name: "Role that can create and manage bans", value: `<@${newConfig.banRole}> | ${newConfig.banRole}` },
				{ name: "Role that can manage the bot's configuration", value: `<@${newConfig.configRole}> | ${newConfig.configRole}` },
				{ name: "Role that can manage FAGC notifications", value: `<@${newConfig.notificationsRole}> | ${newConfig.notificationsRole}` },
			])

		return interaction.reply({content: "Config changed", embeds: [configEmbed]})
	},
}
export default Setup