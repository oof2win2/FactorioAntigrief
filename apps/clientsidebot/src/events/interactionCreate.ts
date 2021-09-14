import { Interaction } from "discord.js"
import FAGCBot from "../base/fagcbot"

export default async (client: FAGCBot, interaction: Interaction): Promise<unknown> => {
	if (!interaction.isCommand()) return

	console.log(interaction.commandId, interaction.commandName)

	const {commandName} = interaction
	if (!client.commands.has(commandName)) return

	try {
		await client.commands.get(commandName)?.execute(client, interaction)
	} catch (e) {
		console.error(e)
		return interaction.reply({content: "There was an error whilst executing this command", ephemeral: true})
	}
}