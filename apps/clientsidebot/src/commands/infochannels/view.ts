import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SubCommand } from "../../base/Commands.js"

const Setaction: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("View infochannels in this guild")
	,
	execute: async ({ client, interaction }) => {
		const channels = await client.db.infoChannel.findMany({
			where: {
				guildId: interaction.guildId
			}
		})
		if (!channels.length) return interaction.reply({
			content: "This guild has no infochannels",
			ephemeral: true
		})
		return interaction.reply({
			content: `This guild has the following info channels: <#${channels.map(c => c.channelId).join(">, <#")}>`,
			ephemeral: true,
		})
	}
}
export default Setaction