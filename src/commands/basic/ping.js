const fetch = require("node-fetch")

const Command = require("../../base/Command")
class Ping extends Command {
	constructor(client) {
		super(client, {
			name: "ping",
			description: "Shows ping to related services",
			aliases: [],
			category: "basic",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message) {
		let wsPing = this.client.ws.ping

		message.channel.send("Pinging...").then(async (m) => {
			let ping = m.createdTimestamp - message.createdTimestamp
			const beforeFetch = Date.now()
			await fetch(this.client.env.APIURL)
			const apilatency = Date.now() - beforeFetch
			m.edit(
				`Bot Latency: \`${ping}ms\`\nDiscord API Latency: \`${wsPing}ms\`\nFAGC API Latency: \`${apilatency}ms\``
			)
		})
	}
}
module.exports = Ping
