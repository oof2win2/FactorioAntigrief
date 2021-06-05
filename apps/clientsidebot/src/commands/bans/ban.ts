import { Message } from "discord.js"
import Command from "../../base/Command"
import { getConfirmationMessage } from "../../utils/responseGetter"

export const command: Command<Message> = {
	name: "ban",
	description: "Set role permissions for command access",
	aliases: ["setroleperms", "setperms"],
	usage: "[username] (reason)",
	examples: ["{{p}}ban Cooldude2606 hackerman"],
	dirname: __dirname,
	enabled: true,
	memberPermissions: ["BAN_MEMBERS"],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: ["ban"],
	run: async (client, message, args) => {
		if (!args[0]) return message.channel.send("Please provide a user to ban")
		const user = args.shift()
		const reason = args.join(" ") || "No reason provided"

		const fetch = await client.prisma.privateBans.findFirst({
			where: {
				playername: user
			}
		})
		if (fetch?.id) return message.channel.send(`\`${user}\` is already banned for ${fetch.reason} by ${await client.users.fetch(fetch.admin).then(u=>`\`${u?.tag}\``)} | ${fetch.admin} at ${new Date(fetch.bannedAt)}`)
		
		const confirm = await getConfirmationMessage(message, `\`${user}\` will be banned for \`${reason}\``)
		if (!confirm)
			return message.channel.send("Banning cancelled")

		try {
			// set to database
			const ban = await client.prisma.privateBans.create({data: {
				admin: message.author.id,
				playername: user,
				reason: reason
			}})
			if (ban.id) return message.channel.send(`\`${user}\` has been banned for \`${reason}\``)
			throw ban
		} catch (error) {
			message.channel.send("Error banning. Please check logs.")
			throw error
		}
	}
}