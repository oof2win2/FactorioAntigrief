import { Message } from "discord.js"
import Command from "../../base/Command"

export const command: Command<Message> = {
	name: "iswhitelisted",
	description: "Check if a user is whitelisted from FAGC violations",
	aliases: ["checkwhitelist"],
	usage: "[username]",
	examples: ["{{p}}iswhitelisted Cooldude2606"],
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
		const whitelist = await client.prisma.whitelist.findFirst({
			where: {playername: player}
		})
		if (whitelist) return message.channel.send(`Player \`${player}\` has been whitelisted at ${new Date(whitelist.whitelistedAt)} by ${await client.users.fetch(whitelist.whitelistedBy).then(a => `\`${a.tag}\` | ${a.id}`)}`)
		return message.channel.send(`Player \`${player}\` is not whitelisted`)
	}
}