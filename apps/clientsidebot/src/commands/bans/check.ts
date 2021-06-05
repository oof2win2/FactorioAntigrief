import { Message } from "discord.js"
import Command from "../../base/Command"

export const command: Command<Message> = {
	name: "isbanned",
	description: "Check if a user is banned localy",
	aliases: ["check"],
	usage: "[username]",
	examples: ["{{p}}isbanned Cooldude2606"],
	dirname: __dirname,
	enabled: true,
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	run: async (client, message, args) => { 
		const player = args.shift()
		if (!player) return message.reply("No player provided!")
		const ban = await client.prisma.privateBans.findFirst({
			where: {playername: player}
		})
		if (ban) return message.channel.send(`Player \`${player}\` has been banned by ${await client.users.fetch(ban.admin).then(a => `\`${a.tag}\` | ${a.id}`)} for reason ${ban.reason} at ${new Date(ban.bannedAt)}`)
		return message.channel.send(`Player \`${player}\` is not banned`)
	}
}