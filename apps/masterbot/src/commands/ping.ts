import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '../utils/Command';

const Ping: Command = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping the bot"),
	execute: async (client, interaction) => {
		const beforeReply = Date.now()
		await interaction.reply("Pong")
		const afterReply = Date.now()

		return interaction.editReply({
			content: `My ping is: ${afterReply - beforeReply}\nDiscord API ping: ${Math.round(client.ws.ping)}`
		})
	}
}
export default Ping