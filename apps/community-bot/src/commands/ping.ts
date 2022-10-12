import { SlashCommandBuilder } from "@discordjs/builders"
import { Command } from "../base/Command"

const Ping: Command<false, false> = {
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	type: "Command",
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping the bot"),
	execute: async ({ client, interaction }) => {
		const beforeReply = Date.now()
		await interaction.reply("Pong")
		const afterReply = Date.now()

		return interaction.editReply({
			content: `My ping is: \`${
				afterReply - beforeReply
			}ms\`\nDiscord API ping: \`${Math.round(client.ws.ping)}ms\``,
		})
	},
}
export default Ping
