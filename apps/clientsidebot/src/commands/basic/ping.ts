import fetch from "node-fetch"
import Command from "../../base/Command"
import {Message} from "discord.js"

export const command: Command<void> = {
	name: "ping",
	description: "Shows ping to related services",
	dirname: __dirname,
	enabled: true,
	aliases: [],
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	run: async (client, message: Message) => {
		let wsPing = client.ws.ping

		message.channel.send("Pinging...").then(async (m) => {
			let ping = m.createdTimestamp - message.createdTimestamp
			const beforeFetch = Date.now()
			await fetch(client.config.apiurl)
			const apilatency = Date.now() - beforeFetch
			m.edit(`Bot Latency: \`${ping}ms\`\nDiscord API Latency: \`${wsPing}ms\`\nFAGC API Latency: \`${apilatency}ms\``)
		})
	}
}