import { Message } from "discord.js"
import Command from "../../base/Command"
import { getConfirmationMessage } from "../../utils/responseGetter"

export const command: Command<Message> = {
	name: "unban",
	description: "Locally unban someone",
	aliases: [],
	usage: "[username]",
	examples: ["{{p}}unban Cooldude2606"],
	dirname: __dirname,
	enabled: true,
	memberPermissions: ["BAN_MEMBERS"],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: ["ban"],
	run: async (client, message, args) => {
		if (!args[0]) return message.channel.send("Please provide a user to unban")
		const playername = args.shift()

		const ban = await client.prisma.privateBans.findFirst({
			where: {
				playername: playername
			}
		})
		if (!ban) return message.channel.send(`\`${playername}\` is not banned locally`)

		const confirm = await getConfirmationMessage(message, `\`${playername}\` will be unbanned. They have been banned by ${ban.admin} at ${new Date(ban.bannedAt)} due to ${ban.reason}`)
		if (!confirm)
			return message.channel.send("Banning cancelled")

		try {
			// set to database
			const unban = await client.prisma.privateBans.delete({
				where: {
					id: ban.id
				}
			})
			if (unban.id) return message.channel.send(`\`${playername}\` has been unbanned`)
			throw unban
		} catch (error) {
			message.channel.send("Error unbanning. Please check logs.")
			throw error
		}
	}
}