import { Message } from "discord.js"

export async function getMessageResponse(content: string, message: Message, timeout = 30000): Promise<Message | null> {
	const messageFilter = response => response.author.id == message.author.id
	const resp = await message.channel.send(content)
	return (await resp.channel.awaitMessages({filter: messageFilter, max: 1, time: timeout })).first()
}
export async function getConfirmationMessage(content: string, message: Message): Promise<boolean> {
	const confirm = await message.channel.send(content)
	confirm.react("✅")
	confirm.react("❌")
	const reactionFilter = (reaction, user) => user.id === message.author.id
	let reactions
	try {
		reactions = await confirm.awaitReactions({
			filter: reactionFilter,
			max: 1,
			time: 120000,
			errors: ["time"]
		})
	} catch (error) {
		return false
	}
	const reaction = reactions.first()
	if (reaction.emoji.name === "❌") return false
	return true
}