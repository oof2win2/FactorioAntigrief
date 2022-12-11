import { Interaction } from "discord.js"
import FDGLBot from "../base/FDGLBot.js"

export default async (client: FDGLBot, [interaction]: [Interaction]) => {
	// if interaction is not a command or not in a guild then we dont care
	if (!interaction.isChatInputCommand() || !interaction.inGuild()) return

	const { commandName } = interaction
	if (!client.commands.has(commandName)) return

	const botConfig = client.botConfig

	// idk but this shouldnt happen
	if (!interaction.inCachedGuild()) return

	try {
		await client.commands
			.get(commandName)
			?.execute({ client, interaction, botConfig })
	} catch (e) {
		console.error(e)
		return interaction.reply({
			content: "There was an error whilst executing this command",
			ephemeral: true,
		})
	}
}
