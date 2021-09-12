import Command from "../../base/Command.js"
import {Message} from "discord.js"

export const command: Command<Message> = {
	name: "getinfochannels",
	description: "Gets all info channel",
	category: "infochannels",
	enabled: true,
	aliases: [],
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: [],
	run: async (client, message) => {
		const infochannels = await client.prisma.infoChannels.findMany()
		const infochannelids = infochannels.map(infochannel => infochannel.channelid)
		if (!infochannelids[0]) return message.channel.send("This guild has not sent any info channels")
		return message.channel.send(`Info channels for this guild: <#${infochannelids.join(">, <#")}>`)
	}
}