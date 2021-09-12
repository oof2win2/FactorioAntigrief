import Command from "../../base/Command.js"
import {Message} from "discord.js"

export const command: Command<Message> = {
	name: "uptime",
	description: "Show bot uptime",
	aliases: [],
	category: "basic",
	enabled: true,
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	run: async (client, message) => {
		function duration(ms) {
			const sec = Math.floor((ms / 1000) % 60).toString()
			const min = Math.floor((ms / (1000 * 60)) % 60).toString()
			const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24).toString()
			const days = Math.floor((ms / (1000 * 60 * 60 * 24)) % 60).toString()
			return `\`${days.padStart(1, "0")}:${hrs.padStart(2, "0")}:${min.padStart(
				2,
				"0"
			)}:${sec.padStart(2, "0")}\``
		}

		return message.channel.send(`My uptime: ${duration(client.uptime)}`)
	}
}
