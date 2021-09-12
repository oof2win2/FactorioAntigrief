import { SlashCommandBuilder } from "@discordjs/builders"
import {Command} from "../base/Command.js"

const Ping: Command = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping the bot"),
	execute: async (client, interaction) => {
		const beforeReply = Date.now()
		await interaction.reply("Pong")
		const afterReply = Date.now()
		await client.fagc.rules.fetchAll()
		const afterFAGC = Date.now()

		return interaction.editReply({
			content: 
			`My ping is: \`${afterReply - beforeReply}ms\`\n` +
			`Discord API ping: \`${Math.round(client.ws.ping)}ms\`\n` +
			`FAGC API ping: \`${afterFAGC - afterReply}ms\`\n`
		})
	}
}
export default Ping