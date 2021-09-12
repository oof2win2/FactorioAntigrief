import { SlashCommandBuilder } from "@discordjs/builders"
import { MessageEmbed } from "discord.js"
import { Command } from "../base/Command.js"

const Stats: Command = {
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("View bot statistics"),
	execute: async (client, interaction) => {
		function duration(ms) {
			const sec = Math.floor((ms / 1000) % 60).toString()
			const min = Math.floor((ms / (1000 * 60)) % 60).toString()
			const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24).toString()
			const days = Math.floor((ms / (1000 * 60 * 60 * 24)) % 60).toString()
			return `${days} days, ${hrs} hrs, ${min} mins, ${sec} secs`
		}

		const memUsage = process.memoryUsage().heapUsed / 1024 / 1024
		const users = client.users.cache.size
		const servers = client.guilds.cache.size
		const channels = client.channels.cache.size
		const nodeVersion = process.version
		const embed = new MessageEmbed()
			.setTitle("Bot Statistics")
			.setColor("GREEN")
			.setTimestamp()
		embed.addFields([
			{ name: "Memory Usage", value: `${Math.round(memUsage * 100) / 100} MB`, inline: true },
			{ name: "Uptime", value: duration(client.uptime), inline: true },
			{ name: "Total Users", value: users.toString(), inline: true },
			{ name: "Total Channels", value: channels.toString(), inline: true },
			{ name: "Total Servers", value: servers.toString(), inline: true },
			{ name: "NodeJS Version", value: nodeVersion, inline: true },
		])
		return interaction.reply({ embeds: [embed], ephemeral: true })
	}
}
export default Stats