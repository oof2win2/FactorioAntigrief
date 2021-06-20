import { Message } from "discord.js"
import Command from "../../base/Command"
import { getConfirmationMessage } from "../../utils/responseGetter"

export const command: Command<Message> = {
	name: "whitelist",
	description: "Add a player to your whitelist, make them immune to FAGC bans",
	aliases: ["addwhitelist"],
	usage: "[username]",
	examples: ["{{p}}whitelist Cooldude2606"],
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
		if (check?.id) return message.channel.send(`\`${playername}\` is already whitelisted!`)
		const confirm = await getConfirmationMessage(message, `Are you sure you want to whitelist \`${playername}\` from FAGC violations?`)
		if (!confirm) return message.channel.send("Whitelisting cancelled")
		
		const whitelist = await client.prisma.whitelist.create({data: {
			playername: playername,
			whitelistedBy: message.author.id
		}})
		if (whitelist?.id) return message.channel.send(`Player \`${whitelist.playername}\` has been whitelisted`)
		message.channel.send("An error while whitelisting has occured")
		throw whitelist
	}
}