module.exports = {
	getMessageResponse,
	getConfirmationMessage,
}

async function getMessageResponse(content, msg, timeout = 30000) {
	const messageFilter = response => response.author.id == msg.author.id
	
	const message = await msg.channel.send(content)
	return (await message.channel.awaitMessages(messageFilter, { max: 1, time: timeout })).first()
}
async function getConfirmationMessage(message, content) {
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