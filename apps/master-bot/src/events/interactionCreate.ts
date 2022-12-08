import { Interaction } from "discord.js"
import FDGLBot from "../utils/FDGLBot.js"

export default async (client: FDGLBot, interaction: Interaction) => {
	if (!interaction.isCommand()) return

	const { commandName } = interaction
	if (!client.commands.has(commandName)) return

	try {
		await client.commands.get(commandName)?.execute({
			client: client,
			interaction: interaction,
		})
	} catch (e) {
		console.error(e)
		return interaction.reply({
			content: "There was an error whilst executing this command",
			ephemeral: true,
		})
	}
}
