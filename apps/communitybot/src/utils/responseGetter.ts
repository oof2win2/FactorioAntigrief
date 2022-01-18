import { Collection, Message, MessageReaction } from "discord.js"

/**
 * Get the next message by the user from the channel
 */
export async function getMessageResponse(message: Message, content: string, timeout = 30000): Promise<Message | null> {
	const msg = await message.channel.send(content)
	return (
		await msg.channel.awaitMessages({
			filter: (m) => m.author.id === message.author.id,
			max: 1,
			time: timeout,
		})
	).first() || null
}

/**
 * Verify if a user wants to do something by asking them to react with an X or a checkmark
 */
export async function getConfirmationMessage(message: Message, content: string, timeout = 120000): Promise<boolean> {
	const confirm = await message.channel.send(content)
	confirm.react("✅")
	confirm.react("❌")
	const reactions = await confirm.awaitReactions({
		filter: (r, u) => u.id === message.author.id,
		max: 1,
		time: timeout,
		errors: []
	})
	const reaction = reactions.first()
	if (!reaction) return false
	if (reaction.emoji.name === "❌") return false
	return true
}
