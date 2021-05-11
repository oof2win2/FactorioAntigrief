// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js")
module.exports = {
	handleErrors,
}

/**
 * 
 * @param {Discord.Message} msg 
 * @param {Object} response - API error message
 * @param {String} response.error - API error name
 * @param {String} response.description - API error description
 */
async function handleErrors(msg, response) {
	switch (response.error) {
	case "AuthenticationError": {
		switch (response.description) {
		case "API key is wrong":
			return msg.channel.send("Error: API key has been set incorrectly.")
		}
		break
	}
	default:
		msg.channel.send(`Error \`${response.error}\`: \`${response.description}\``)
	}
}