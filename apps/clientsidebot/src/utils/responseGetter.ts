import { Message } from "discord.js"

module.exports = {
	getMessageResponse,
	getConfirmationMessage,
}
export async function getMessageResponse(content: string, message: Message, timeout: number = 30000): Promise<Message> {
	const messageFilter = response => response.author.id == message.author.id
	const resp = await message.channel.send(content)
	return (await resp.channel.awaitMessages(messageFilter, { max: 1, time: timeout })).first()
}
export async function getConfirmationMessage(message: Message, content: string): Promise<Boolean> {
	const confirm = await message.channel.send(content)
	confirm.react("✅")
	confirm.react("❌")
	const reactionFilter = (reaction, user) => user.id === message.author.id
	let reactions
	try {
		reactions = await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ["time"] })
	} catch (error) {
		return false
	}
	const reaction = reactions.first()
	if (reaction.emoji.name === "❌") return false
	return true
}