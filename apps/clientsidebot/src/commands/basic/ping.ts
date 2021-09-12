import fetch from "node-fetch"
import Command from "../../base/Command.js"
import {Message} from "discord.js"

export const command: Command<void> = {
	name: "ping",
	description: "Shows ping to related services",
	enabled: true,
	aliases: [],
	category: "basic",
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	run: async (client, message: Message) => {
		const wsPing = client.ws.ping

		message.channel.send("Pinging...").then(async (m) => {
			const ping = m.createdTimestamp - message.createdTimestamp
			const beforeFetch = Date.now()
			await fetch(client.config.apiurl)
			const apilatency = Date.now() - beforeFetch
			m.edit(`Bot Latency: \`${ping}ms\`\nDiscord API Latency: \`${wsPing}ms\`\nFAGC API Latency: \`${apilatency}ms\``)
		})
	}
}