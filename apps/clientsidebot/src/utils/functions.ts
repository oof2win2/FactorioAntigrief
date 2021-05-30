import { Message } from "discord.js"

/**
 * 
 * @param {Object} msg - Discord message
 * @param {Object} response - API error message
 * @param {string} response.error - API error name
 * @param {string} response.description - API error description
 */
export async function handleErrors(msg: Message, response): Promise<Message> {
	if (!msg.channel) return
	switch (response.error) {
	case "AuthenticationError": {
		switch (response.description) {
		case "API key is wrong":
			return msg.channel.send("Error: API key has been set incorrectly.")
		}
		break
	}
	default:
		return msg.channel.send(`Error \`${response.error}\`: \`${response.description}\``)
	}
}