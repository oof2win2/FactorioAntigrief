const json = require("../../../package.json")
import Command from "../../base/Command"
import { MessageEmbed, Message } from "discord.js"

export const command: Command<Message> = {
	name: "stats",
	description: "Show bot stats",
	aliases: [],
	dirname: __dirname,
	enabled: true,
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 1000,
	requiredConfig: false,
	run: async (client, message) => {
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
		const djsVersion = json.dependencies["discord.js"].slice(1)
		const embed = new MessageEmbed()
			.setTitle("FAGC Stats")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
		embed.addFields(
			{ name: "Memory Usage", value: `${Math.round(memUsage * 100) / 100} MB`, inline:true },
			{ name: "Uptime", value: duration(client.uptime), inline:true },
			{ name: "Total Users", value: users, inline:true },
			{ name: "Total Channels", value: channels, inline:true },
			{name: "Total Servers", value: servers, inline: true},
			{ name: "NodeJS Version", value: nodeVersion, inline:true },
			{ name: "DJS Version", value: `v${djsVersion}`, inline:true },
		)
		return message.channel.send(embed)
	}
}