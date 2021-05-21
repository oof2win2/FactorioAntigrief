const { MessageEmbed } = require("discord.js")
const json = require("../../../package.json")
const Command = require("../../base/Command")

class Stats extends Command {
	constructor(client) {
		super(client, {
			name: "stats",
			description: "Show bot stats",
			aliases: [],
			category: "basic",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 1000,
			requiredConfig: false,
		})
	}
	async run(message) {
		function duration(ms) {
			const sec = Math.floor((ms / 1000) % 60).toString()
			const min = Math.floor((ms / (1000 * 60)) % 60).toString()
			const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24).toString()
			const days = Math.floor((ms / (1000 * 60 * 60 * 24)) % 60).toString()
			return `${days} days, ${hrs} hrs, ${min} mins, ${sec} secs`
		}

		let memUsage = process.memoryUsage().heapUsed / 1024 / 1024
		let users = this.client.users.cache.size
		let servers = this.client.guilds.cache.size
		let channels = this.client.channels.cache.size
		let nodeVersion = process.version
		let djsVersion = json.dependencies["discord.js"].slice(1)
		let embed = new MessageEmbed()
			.setTitle("FAGC Stats")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
		embed.addFields(
			{ name: "Memory Usage", value: `${Math.round(memUsage * 100) / 100} MB`, inline:true },
			{ name: "Uptime", value: duration(this.client.uptime), inline:true },
			{ name: "Total Users", value: users, inline:true },
			{ name: "Total Channels", value: channels, inline:true },
			{name: "Total Servers", value: servers, inline: true},
			{ name: "NodeJS Version", value: nodeVersion, inline:true },
			{ name: "DJS Version", value: `v${djsVersion}`, inline:true },
		)
		message.channel.send(embed)
	}
}
module.exports = Stats