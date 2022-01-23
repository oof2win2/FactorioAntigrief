import { MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"

const stats: Command = {
	name: "stats",
	description: "Shows stats about the bot",
	usage: "",
	aliases: [],
	examples: [],
	category: "basic",
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ message, client }) => {
		const memUsage = process.memoryUsage().heapUsed / 1024 / 1024 // get heap used in MB
		const uptime = process.uptime() // get uptime in seconds
		const ping = client.ws.ping // get discord api ping in ms
		const guilds = client.guilds.cache.size // get amount of guilds the bot is in
		const users = client.users.cache.size // get amount of users the bot is in
		const channels = client.channels.cache.size // get amount of channels the bot is in

		const embed = new MessageEmbed()
			.setColor("#0099ff")
			.setTitle("Stats")
			.addField("Memory usage", `${memUsage.toFixed(2)} MB`, true)
			.addField("Uptime", `${uptime.toFixed(2)} seconds`, true)
			.addField("Discord API ping", `${ping} ms`, true)
			.addField("Guild count", guilds.toString(), true)
			.addField("User count", users.toString(), true)
			.addField("Channel count", channels.toString(), true)
			.setTimestamp()
			.setFooter({ text: client.config.embeds.footer })
			.setAuthor({ name: client.config.embeds.author })
		return message.channel.send({
			embeds: [embed],
		})
	},
}
export default stats
