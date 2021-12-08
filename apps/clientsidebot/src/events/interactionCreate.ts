import { Interaction } from "discord.js"
import FAGCBot from "../base/FAGCBot.js"

export default async (client: FAGCBot, [ interaction ]: [Interaction]) => {
	if (!interaction.isCommand()) return

	const { commandName } = interaction
	if (!client.commands.has(commandName)) return

	try {
		await client.commands.get(commandName)?.execute(client, interaction)
	} catch (e) {
		console.error(e)
		return interaction.reply({ content: "There was an error whilst executing this command", ephemeral: true })
	}
}