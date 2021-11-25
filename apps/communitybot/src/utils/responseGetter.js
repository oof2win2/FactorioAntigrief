// eslint-disable-next-line no-unused-vars
const { Message } = require("discord.js")

module.exports = {
	getMessageResponse,
	getConfirmationMessage,
}

/**
 * @param {Message} message
 * @param {string} content
 * @param {number} timeout
 * @returns {Promise<Message | null>}
 */
async function getMessageResponse(message, content, timeout = 30000) {
	const messageFilter = (response) => response.author.id == message.author.id

	const msg = await message.channel.send(content)
	return (
		await msg.channel.awaitMessages(messageFilter, {
			max: 1,
			time: timeout,
		})
	).first() || null
}
async function getConfirmationMessage(message, content, timeout = 120000) {
	const confirm = await message.channel.send(content)
	confirm.react("✅")
	confirm.react("❌")
	const reactionFilter = (reaction, user) => user.id === message.author.id
	let reactions
	try {
		reactions = await confirm.awaitReactions(reactionFilter, {
			max: 1,
			time: timeout,
			errors: [ "time" ],
		})
	} catch (error) {
		return false
	}
	const reaction = reactions.first()
	if (reaction.emoji.name === "❌") return false
	return true
}
