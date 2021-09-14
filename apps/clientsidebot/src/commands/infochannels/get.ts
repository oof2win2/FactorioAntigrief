import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {SubCommand} from "../../base/Command.js"

const GetInfochannels: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("get")
		.setDescription("Get a list of all infochannels"),
	execute: async (client, interaction) => {
		const infochannels = await client.prisma.infoChannels.findMany()
		if (!infochannels.length) return interaction.reply("This guild has no infochannels")
		return interaction.reply(`Infochannels for this guild are <#${infochannels.map(channel => channel.channelid).join(">, <#")}>`)
	}
}
export default GetInfochannels