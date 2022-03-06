import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { ChannelType } from "discord-api-types"
import { SubCommand } from "../../base/Commands.js"
import InfoChannel from "../../database/InfoChannel.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create an info channel in this guild")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Channel where to create an info channel")
				.setRequired(true)
				.addChannelTypes([ChannelType.GuildNews, ChannelType.GuildText])
		),
	execute: async ({ client, interaction }) => {
		const channel = interaction.options.getChannel("channel", true)
		const existing = await client.db.getRepository(InfoChannel).findOne({
			guildId: interaction.guildId,
			channelId: channel.id,
		})
		if (existing)
			return interaction.reply({
				content: `<#${channel.id}> already is an info channel`,
				ephemeral: true,
			})

		await client.db.getRepository(InfoChannel).insert({
			guildId: interaction.guildId,
			channelId: channel.id,
		})
		return interaction.reply({
			content: `Info channel in <#${channel.id}> has been created`,
		})
	},
}
export default Setaction
