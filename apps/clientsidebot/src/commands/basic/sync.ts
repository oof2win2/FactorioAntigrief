import Command from "../../base/Command.js"
import { Message, MessageEmbed } from "discord.js"
import { getMessageResponse, getConfirmationMessage } from "../../utils/responseGetter.js"
import rcon from "../../base/rcon.js"
import { PlayerJoin } from "../../base/FAGCHandler.js"

export const command: Command<Message> = {
	name: "sync",
	description: "Sync all reports and revocations",
	aliases: [],
	usage: "{{p}}sync",
	category: "basic",
	enabled: true,
	memberPermissions: ["BAN_MEMBERS"],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: [],
	run: async (client, message) => {
		const onlinePlayerMessages = await rcon.rconCommandAll("/p o").then(rconOutput => rconOutput.map(out => out.resp))
		const onlinePlayers = []
		onlinePlayerMessages.forEach(message => {
			const players = message.slice(message.indexOf("\n")).trim().split("\n").map(line => line.slice(0, line.indexOf(" (online)")).trim())
			players.forEach(player => { if (!onlinePlayers.includes(player)) onlinePlayers.push(player) })
		})
		onlinePlayers.forEach(playername => PlayerJoin(playername, client))

		return message.channel.send("Reports and revocations will be synced intermittently")
	}
}
