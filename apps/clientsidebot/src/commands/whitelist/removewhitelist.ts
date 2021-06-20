import { Message } from "discord.js"
import Command from "../../base/Command"
import { getConfirmationMessage } from "../../utils/responseGetter"

export const command: Command<Message> = {
	name: "removewhitelist",
	description: "Remove a player to your whitelist, make them no-longer immune to FAGC bans",
	aliases: ["unwhitelist"],
	usage: "[username]",
	examples: ["{{p}}removewhitelist Cooldude2606"],
	dirname: __dirname,
	enabled: true,
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	run: async (client, message, args) => { 
		const playername = args.shift()
		if (!playername) return message.reply("No player provided!")
		const check = await client.prisma.whitelist.findFirst({
			where: {playername: playername}
		})
		if (!check?.id) return message.channel.send(`\`${playername}\` is not whitelisted`)
		const confirm = await getConfirmationMessage(`Are you sure you want to unwhitelist \`${playername}\` from FAGC violations?`, message)
		if (!confirm)
			return message.channel.send("Unwhitelisting cancelled")
		const whitelist = await client.prisma.whitelist.delete({
			where: {
				id: check.id
			}
		})
		if (whitelist?.id) return message.channel.send(`Player \`${whitelist.playername}\` has been removed from your whitelist`)
		message.channel.send("An error while removing whitelist has occured")
		throw whitelist
	}
}