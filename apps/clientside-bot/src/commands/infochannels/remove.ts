import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { ChannelType } from "discord-api-types"
import { SubCommand } from "../../base/Commands.js"
import InfoChannel from "../../database/InfoChannel.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove an info channel")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Info channel which to remove")
				.setRequired(true)
				.addChannelTypes([ChannelType.GuildNews, ChannelType.GuildText])
		),
	execute: async ({ client, interaction }) => {
		const channel = interaction.options.getChannel("channel", true)
		const removed = await client.db.getRepository(InfoChannel).delete({
			guildId: interaction.guildId,
			channelId: channel.id,
		})
		if (!removed.affected)
			return interaction.reply({
				content: `<#${channel.id}> is not an info channel`,
				ephemeral: true,
			})

		return interaction.reply({
			content: `Info channel in <#${channel.id}> has been removed`,
		})
	},
}
export default Setaction
