import Command from "../../base/Command.js"
import {Message} from "discord.js"
import { getConfirmationMessage } from "../../utils/responseGetter.js"

export const command: Command<Message|void> = {
	name: "addinfochannel",
	description: "Add an info channel",
	category: "infochannels",
	usage: "[channel]",
	enabled: true,
	aliases: [],
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: ["notifications"],
	run: async (client, message, args) => {
		if (!args[0]) return message.channel.send("Please provide a channel to send FAGC notifications to")

		const channel = message.mentions.channels.first() || await client.channels.fetch(args[0])
		if (!channel) return message.channel.send(`\`${message.cleanContent}\` is not a valid channel ping or channel ID`)

		const confirm = await getConfirmationMessage(`Are you sure that you want to send FAGC notifications to ${channel}?`, message)
		if (!confirm) return message.channel.send("Adding of info channel cancelled")


		if (await client.prisma.infoChannels.findFirst({where: {channelid: channel.id}}))
			return message.channel.send(`Channel <#${channel.id}> is already recieving FAGC notifications`)
		const infochannel = await client.prisma.infoChannels.create({data: {
			channelid: channel.id,
			configid: 1
		}})
		if (infochannel.channelid === channel.id) return message.channel.send(`${channel} will now recieve FAGC notifications`)
		throw infochannel
	}
}