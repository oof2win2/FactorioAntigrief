import Command from "../../base/Command.js"
import {Message} from "discord.js"
import { getConfirmationMessage } from "../../utils/responseGetter.js"

export const command: Command<Message|void> = {
	name: "removeinfochannel",
	description: "Remove an info channel",
	usage: "[channel]",
	category: "infochannels",
	enabled: true,
	aliases: [],
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: ["notifications"],
	run: async (client, message, args) => {
		if (!args[0]) return message.channel.send("Please provide a channel to stop sending FAGC notifications to")

		const channel = message.mentions.channels.first() || await client.channels.fetch(args[0])
		if (!channel) return message.channel.send(`\`${message.cleanContent}\` is not a valid channel ping or channel ID`)

		const confirm = await getConfirmationMessage(`Are you sure that you want to stop sending FAGC notifications to ${channel}?`, message)
		if (!confirm) return message.channel.send("Removal of info channel cancelled")

		const infochannel = await client.prisma.infoChannels.delete({where: {
			channelid: channel.id,
		}})
		if (infochannel.channelid === channel.id) return message.channel.send(`${channel} will stop recieving FAGC notifications`)
		throw infochannel
	}
}